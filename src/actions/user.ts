"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

export async function setUsername(formData: FormData) {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const username = formData.get("username") as string;
  if (!username) return { error: "Username required" };

  // simple validation (alphanumeric, underscores, hyphens)
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    return { error: "Invalid username format" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { username: username.toLowerCase() }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: "Username already taken" };
    }
    return { error: "Failed to set username" };
  }
}
