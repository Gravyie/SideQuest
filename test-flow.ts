import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const { prisma } = await import("./src/lib/prisma");
  const email = "gappisingh08@gmail.com";

  console.log("Cleaning up old data...");
  await prisma.review.deleteMany({ where: { OR: [{ reviewer: { email } }, { reviewee: { email } }] } });
  await prisma.questMember.deleteMany({ where: { user: { email } } });
  await prisma.draftEntry.deleteMany({ where: { user: { email } } });
  await prisma.waitlist.deleteMany({ where: { email } });
  await prisma.user.deleteMany({ where: { email } });
  
  console.log("Cleanup complete!");
}

main().catch(console.error);
