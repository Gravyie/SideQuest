import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy");
  
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    // Retrieve the metadata we passed during checkout creation
    const userId = session.metadata?.userId;
    const weekendId = session.metadata?.weekendId;
    const availabilityRaw = session.metadata?.availability;

    if (!userId || !weekendId || !availabilityRaw) {
      return new NextResponse("Missing metadata", { status: 400 });
    }

    const availability = JSON.parse(availabilityRaw);

    // Create the DraftEntry now that they have paid the deposit
    await prisma.draftEntry.create({
      data: {
        userId,
        weekendId,
        availability,
        depositPaid: true,
        stripeSessionId: session.id, // Save this so we can issue a refund later
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}