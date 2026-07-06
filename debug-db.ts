import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const { prisma } = await import("./src/lib/prisma");

  await prisma.user.updateMany({
    where: { email: "gappisingh08@gmail.com" },
    data: { community: "SideQuest HQ" }
  });
  
  console.log("Community updated to SideQuest HQ!");
}

main().catch(console.error);
