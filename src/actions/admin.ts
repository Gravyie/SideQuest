"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { User } from "@prisma/client";

export async function createQuest(formData: FormData) {
  const userIds = formData.getAll("userIds") as string[];
  const weekendId = "2026-06-27"; // Hardcoded MVP

  if (userIds.length === 0) {
    console.error("No users selected");
    return;
  }

  try {
    // 1. Get the community of the first user (assuming admins group by community)
    const firstUser = await prisma.user.findUnique({
      where: { id: userIds[0] },
    });

    if (!firstUser) return;

    // 2. Create the Quest
    const quest = await prisma.quest.create({
      data: {
        weekendId,
        community: firstUser.community,
        status: "ACTIVE",
      },
    });

    // 3. Add members
    await Promise.all(
      userIds.map((userId) =>
        prisma.questMember.create({
          data: {
            questId: quest.id,
            userId,
            role: "BUILDER",
          },
        })
      )
    );

    // 4. Mark draft entries as matched
    await prisma.draftEntry.updateMany({
      where: {
        userId: { in: userIds },
        weekendId,
      },
      data: { matched: true },
    });

    // 5. Send Match Emails
    const { sendMatchEmail } = await import("@/lib/email");

    const matchedUsers: User[] = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
    });

    for (const user of matchedUsers) {
      const teammates = matchedUsers.filter((u) => u.id !== user.id);
      await sendMatchEmail(user.email, user.name, teammates);
    }

    revalidatePath("/admin");
  } catch (error) {
    console.error("Error creating quest:", error);
  }
}