"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendMatchEmail } from "@/lib/email";

// Helper to find intersection of two arrays
const hasIntersection = (arr1: string[], arr2: string[]) => arr1.some(item => arr2.includes(item));

export async function runAutomatedMatching() {
  const WEEKEND_ID = "2026-06-27"; // Hardcoded for MVP

  // 1. Fetch all unmatched entries
  const unmatchedEntries = await prisma.draftEntry.findMany({
    where: { weekendId: WEEKEND_ID, matched: false },
    include: { user: true }
  });

  if (unmatchedEntries.length === 0) {
    return { success: true, message: "No unmatched users found.", matchesCreated: 0 };
  }

  // 2. Group by Community
  const communityGroups: Record<string, typeof unmatchedEntries> = {};
  for (const entry of unmatchedEntries) {
    const comm = entry.user.community;
    if (!communityGroups[comm]) communityGroups[comm] = [];
    communityGroups[comm].push(entry);
  }

  let matchesCreated = 0;

  // 3. Match within each community
  for (const [community, members] of Object.entries(communityGroups)) {
    // Keep a pool of unmatched members in this community
    let pool = [...members];

    while (pool.length >= 2) {
      // Pick the first person
      const p1 = pool.shift()!;
      let p2Index = -1;
      let p3Index = -1;

      // Find a compatible p2 (shares availability)
      for (let i = 0; i < pool.length; i++) {
        if (hasIntersection(p1.availability, pool[i].availability)) {
          p2Index = i;
          break;
        }
      }

      if (p2Index === -1) {
        // No one shares availability with p1. Push back to the end of the pool?
        // For soft algorithm: if we just can't find perfect overlap, just group them anyway if it's the end of the line
        if (pool.length < 3) {
           p2Index = 0; // Force match
        } else {
           continue; // Skip p1 for now, they are doomed
        }
      }

      const p2 = pool.splice(p2Index, 1)[0];
      const sharedAvailability = p1.availability.filter(a => p2.availability.includes(a));
      const fallbackAvailability = sharedAvailability.length > 0 ? sharedAvailability : p1.availability;

      // Try to find a p3
      for (let i = 0; i < pool.length; i++) {
        if (hasIntersection(fallbackAvailability, pool[i].availability)) {
          p3Index = i;
          break;
        }
      }

      const team = [p1, p2];
      if (p3Index !== -1) {
        team.push(pool.splice(p3Index, 1)[0]);
      } else if (pool.length > 0) {
        // Soft match a 3rd person if someone is just sitting there
        team.push(pool.splice(0, 1)[0]);
      }

      // We have a squad of 2 or 3! Create the Quest.
      const quest = await prisma.quest.create({
        data: {
          weekendId: WEEKEND_ID,
          community: community,
          members: {
            create: team.map(m => ({ userId: m.userId }))
          }
        }
      });

      // Mark DraftEntries as matched
      await prisma.draftEntry.updateMany({
        where: { id: { in: team.map(m => m.id) } },
        data: { matched: true }
      });

      // Send Emails
      for (const member of team) {
        const teammates = team.filter(t => t.userId !== member.userId).map(t => t.user);
        await sendMatchEmail(member.user.email, member.user.name, teammates);
      }

      matchesCreated++;
    }
  }

  revalidatePath("/admin");
  return { success: true, message: "Protocol Complete", matchesCreated };
}
