"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

export async function submitReview(formData: FormData) {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const questId = formData.get("questId") as string;
  const revieweeId = formData.get("revieweeId") as string;
  const wouldWorkAgainStr = formData.get("wouldWorkAgain") as string;

  if (!questId || !revieweeId || !wouldWorkAgainStr) {
    return { error: "Missing fields" };
  }

  const wouldWorkAgain = wouldWorkAgainStr === "true";

  try {
    // 1. Create the review
    await prisma.review.create({
      data: {
        questId,
        reviewerId: user.id,
        revieweeId,
        wouldWorkAgain,
      }
    });

    // 2. Update the target user's trust score (+5 or -10)
    const scoreChange = wouldWorkAgain ? 5 : -10;
    
    await prisma.user.update({
      where: { id: revieweeId },
      data: {
        trustScore: {
          increment: scoreChange
        }
      }
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to submit review:", error);
    return { error: "Failed to submit review" };
  }
}
