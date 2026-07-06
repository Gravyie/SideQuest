import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Hardcoded admin email for V1
const ADMIN_EMAIL = "garv@example.com"; // Replace with actual admin email if needed

async function approveWaitlist(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  
  const entry = await prisma.waitlist.update({
    where: { id },
    data: { status: "APPROVED" }
  });
  
  const { sendWaitlistApprovalEmail } = await import("@/lib/email");
  await sendWaitlistApprovalEmail(entry.email, entry.name);
  
  revalidatePath("/admin");
}

async function rejectWaitlist(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  
  await prisma.waitlist.update({
    where: { id },
    data: { status: "REJECTED" }
  });
  
  revalidatePath("/admin");
}

import { createQuest } from "@/actions/admin";

export default async function AdminPage() {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  // Extremely basic auth for V1
  if (!email) {
    return redirect("/sign-in");
  }

  const pendingEntries = await prisma.waitlist.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" }
  });

  const UPCOMING_WEEKEND_ID = "2026-06-27";
  const draftEntries = await prisma.draftEntry.findMany({
    where: { weekendId: UPCOMING_WEEKEND_ID, matched: false },
    include: { user: true }
  });

  const activeQuests = await prisma.quest.findMany({
    where: { weekendId: UPCOMING_WEEKEND_ID },
    include: { members: { include: { user: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage waitlist and manual weekend matches.</p>
        </div>
        
        {/* Waitlist Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Pending Waitlist ({pendingEntries.length})</h2>
          
          {pendingEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending entries.</p>
          ) : (
            <div className="divide-y divide-border">
              {pendingEntries.map((entry) => (
                <div key={entry.id} className="py-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{entry.name} <span className="text-sm text-muted-foreground font-normal">({entry.email})</span></h3>
                    <p className="text-sm mt-1"><span className="font-medium">Community:</span> {entry.community}</p>
                    <p className="text-sm mt-1"><span className="font-medium">Proof of Work:</span> <a href={entry.proofOfWorkUrl} target="_blank" className="text-primary hover:underline">{entry.proofOfWorkUrl}</a></p>
                    <p className="text-sm mt-2 text-muted-foreground"><span className="font-medium text-foreground">Motivation:</span> {entry.motivation}</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={approveWaitlist}>
                      <input type="hidden" name="id" value={entry.id} />
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">Approve</button>
                    </form>
                    <form action={rejectWaitlist}>
                      <input type="hidden" name="id" value={entry.id} />
                      <button className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium rounded-lg">Reject</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phase H: Automated Matchmaker Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Weekend Matchmaker ({draftEntries.length} Unmatched)</h2>
          
          {draftEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No unmatched users for this weekend.</p>
          ) : (
            <div>
              <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">The Automated Matching Algorithm will:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Group users by Community.</li>
                  <li>Find intersecting Availability.</li>
                  <li>Balance Skills (Soft Match).</li>
                  <li>Create Quests and dispatch Emails instantly.</li>
                </ul>
              </div>
              <form action={async () => {
                "use server";
                const { runAutomatedMatching } = await import("@/actions/matchmaker");
                await runAutomatedMatching();
              }}>
                <button type="submit" className="w-full px-6 py-4 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-all hover:scale-[1.02] shadow-xl flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Initialize Weekend Match Protocol
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Phase D: Active Quests */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Active Quests ({activeQuests.length})</h2>
          {activeQuests.length === 0 ? (
            <p className="text-muted-foreground text-sm">No quests created yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeQuests.map((quest) => (
                <div key={quest.id} className="p-4 border border-border rounded-lg bg-secondary/20">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Quest #{quest.id.slice(0,6)}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${quest.status === 'SHIPPED' ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
                      {quest.status}
                    </span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {quest.members.map(member => (
                      <li key={member.id} className="text-sm text-muted-foreground flex justify-between">
                        <span>{member.user.name}</span>
                        <span>{member.user.community}</span>
                      </li>
                    ))}
                  </ul>
                  {quest.shippedUrl && (
                    <a href={quest.shippedUrl} target="_blank" className="text-sm text-primary hover:underline">
                      View Shipped Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
