"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

export async function submitProject(formData: FormData) {
  const questId = formData.get("questId") as string;
  const shippedUrl = formData.get("shippedUrl") as string;

  if (!shippedUrl) return { error: "Please provide a URL." };

  try {
    const updatedQuest = await prisma.quest.update({
      where: { id: questId },
      data: {
        shippedUrl,
        status: "SHIPPED",
      },
      include: {
        members: {
          include: {
            user: {
              include: { draftEntries: { where: { weekendId: "2026-06-27" } } }
            }
          }
        }
      }
    });

    // Automatically Refund the $10 deposit for everyone on the team who paid
    const Stripe = (await import("stripe")).default;
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      for (const member of updatedQuest.members) {
        const draft = member.user.draftEntries[0];
        if (draft?.depositPaid && draft?.stripeSessionId) {
          try {
            // Retrieve the session to get the PaymentIntent ID
            const session = await stripe.checkout.sessions.retrieve(draft.stripeSessionId);
            if (session.payment_intent) {
              await stripe.refunds.create({
                payment_intent: session.payment_intent as string,
              });
              console.log(`Refunded $10 to ${member.user.email}`);
            }
          } catch (refundError) {
            console.error(`Failed to refund ${member.user.email}:`, refundError);
          }
        }
      }
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to submit project", error);
    return { error: "An error occurred." };
  }
}

export async function optIn(formData: FormData) {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const availability = formData.getAll("availability") as string[];
  const skills = formData.getAll("skills") as string[];

  if (availability.length === 0) {
    return { error: "Please select at least one availability slot." };
  }

  // Find the exact user from db
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) return { error: "User not found" };

  // Update their skills if they provided any new ones
  if (skills.length > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { skills }
    });
  }

  // We don't create the DraftEntry yet. We redirect to Stripe.
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // The metadata is crucial so our webhook knows what to create when the payment succeeds
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "SideQuest Weekend Deposit",
              description: "This $10 deposit guarantees you won't flake. You will be refunded automatically when you ship your project by Sunday night.",
            },
            unit_amount: 1000, // $10.00
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        weekendId: "2026-06-27",
        availability: JSON.stringify(availability),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?canceled=true`,
    });

    if (!session.url) throw new Error("Failed to create Stripe session");

    // We must return the URL so the client can redirect
    return { success: true, redirectUrl: session.url };
  } catch (error) {
    console.error("Stripe Error:", error);
    return { error: "Failed to initialize deposit." };
  }
}
