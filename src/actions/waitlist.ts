"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function joinWaitlist(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const community = formData.get("community") as string;
  const proofOfWorkUrl = formData.get("proofOfWorkUrl") as string;
  const motivation = formData.get("motivation") as string;

  if (!name || !email || !community || !proofOfWorkUrl || !motivation) {
    return { error: "All fields are required.", success: false };
  }

  try {
    // Check if already in waitlist
    const existing = await prisma.waitlist.findUnique({
      where: { email },
    });

    if (existing) {
      return { error: "You are already on the waitlist.", success: false };
    }

    await prisma.waitlist.create({
      data: {
        name,
        email,
        community,
        proofOfWorkUrl,
        motivation,
      },
    });

    revalidatePath("/waitlist");
    return { success: true, message: "Successfully joined the waitlist!" };
  } catch (error) {
    console.error("Waitlist error:", error);
    return { error: "An error occurred. Please try again.", success: false };
  }
}
