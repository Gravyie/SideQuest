import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const { prisma } = await import("./src/lib/prisma");

  console.log("Cleaning up old Drafts & Quests...");
  await prisma.review.deleteMany();
  await prisma.questMember.deleteMany();
  await prisma.quest.deleteMany();
  await prisma.draftEntry.deleteMany();

  // Delete all dummy users from previous tests
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@dummy.com" } }
  });

  console.log("Creating dummy users & opting them in...");
  const UPCOMING_WEEKEND_ID = "2026-06-27";

  const dummies = [
    {
      id: "dummy_1",
      email: "alice@dummy.com",
      name: "Alice Designer",
      community: "SideQuest HQ",
      motivation: "Want to design a cool app.",
      skills: ["Design"],
      proofOfWorkUrl: "https://dribbble.com",
      availability: ["Saturday", "Sunday"]
    },
    {
      id: "dummy_2",
      email: "bob@dummy.com",
      name: "Bob Backend",
      community: "SideQuest HQ",
      motivation: "Want to build an API.",
      skills: ["Backend"],
      proofOfWorkUrl: "https://github.com",
      availability: ["Saturday"]
    },
    {
      id: "dummy_3",
      email: "charlie@dummy.com",
      name: "Charlie Frontend",
      community: "SideQuest HQ",
      motivation: "Want to learn React.",
      skills: ["Frontend"],
      proofOfWorkUrl: "https://github.com",
      availability: ["Sunday"]
    },
    {
      id: "dummy_4",
      email: "diana@dummy.com",
      name: "Diana Mobile",
      community: "SideQuest HQ",
      motivation: "Want to build an iOS app.",
      skills: ["Mobile"],
      proofOfWorkUrl: "https://github.com",
      availability: ["Saturday", "Sunday"]
    }
  ];

  for (const d of dummies) {
    await prisma.user.create({
      data: {
        id: d.id,
        email: d.email,
        name: d.name,
        community: d.community,
        motivation: d.motivation,
        skills: d.skills,
        proofOfWorkUrl: d.proofOfWorkUrl,
        approved: true
      }
    });

    await prisma.draftEntry.create({
      data: {
        userId: d.id,
        weekendId: UPCOMING_WEEKEND_ID,
        availability: d.availability
      }
    });
  }

  console.log("Seeding complete! 4 dummy users are waiting in the Draft.");
}

main().catch(console.error);
