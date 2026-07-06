import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { revalidatePath } from "next/cache";

// The upcoming weekend draft ID (hardcoded for MVP)
const UPCOMING_WEEKEND_ID = "2026-06-27";

import { optIn } from "@/actions/quest";

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) return redirect("/sign-in");

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return redirect("/sign-in");

  // Check if User exists in DB
  let user = await prisma.user.findUnique({
    where: { id: clerkUser.id }
  });

  // If not, check if they are approved on the waitlist
  if (!user) {
    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { email }
    });

    if (waitlistEntry && waitlistEntry.status === "APPROVED") {
      // Auto-create user from waitlist data
      user = await prisma.user.create({
        data: {
          id: clerkUser.id,
          email: waitlistEntry.email,
          name: waitlistEntry.name,
          community: waitlistEntry.community,
          motivation: waitlistEntry.motivation,
          proofOfWorkUrl: waitlistEntry.proofOfWorkUrl,
          approved: true,
        }
      });
    } else {
      // Not approved or not on waitlist
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center bg-card p-8 rounded-2xl border border-border">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Pending Access</h2>
            <p className="text-muted-foreground mb-6">
              You must be approved via the waitlist before accessing the dashboard. If you just applied, please wait for our email!
            </p>
            <Link href="/waitlist" className="text-primary hover:underline">Go to Waitlist</Link>
          </div>
        </div>
      );
    }
  }

  // Check if they already opted in
  const existingDraft = await prisma.draftEntry.findFirst({
    where: {
      userId: user.id,
      weekendId: UPCOMING_WEEKEND_ID
    }
  });

  // Check if they are already matched in a Quest
  const activeMembership = await prisma.questMember.findFirst({
    where: {
      userId: user.id,
      quest: { weekendId: UPCOMING_WEEKEND_ID }
    },
    include: {
      quest: {
        include: {
          members: { include: { user: true } },
          reviews: { where: { reviewerId: user.id } } // Check which reviews this user has given
        }
      }
    }
  });

  const activeQuest = activeMembership?.quest;
  
  // Calculate pending reviews
  const teammates = activeQuest?.members.filter(m => m.userId !== user.id) || [];
  const reviewedTeammateIds = activeQuest?.reviews.map(r => r.revieweeId) || [];
  const pendingReviewTeammates = teammates.filter(t => !reviewedTeammateIds.includes(t.userId));

  return (
    <div className="min-h-screen bg-background p-8 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-12 flex items-center justify-between border-b border-border/50 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1">Welcome, {user.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {user.community} Builder • Trust: {user.trustScore}
            </p>
          </div>
          {user.username && (
            <a href={`/u/${user.username}`} target="_blank" className="text-sm font-medium text-primary hover:underline">
              View Public Profile
            </a>
          )}
        </header>

        {activeQuest ? (
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 p-10 rounded-3xl shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Your Squad</h2>
                <p className="text-muted-foreground mt-1">Reach out to your teammates and start building.</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide ${activeQuest.status === 'SHIPPED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                {activeQuest.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {activeQuest.members.map(member => (
                <div key={member.id} className="p-6 rounded-2xl bg-background/50 border border-border/50 hover:bg-background/80 transition-all hover:-translate-y-1 group shadow-sm">
                  <h3 className="font-semibold text-xl mb-1">{member.user.name} {member.user.id === user.id && <span className="text-muted-foreground text-sm font-normal">(You)</span>}</h3>
                  <a href={`mailto:${member.user.email}`} className="text-sm text-primary hover:underline block mb-4 truncate">{member.user.email}</a>
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed">"{member.user.motivation}"</p>
                  <a href={member.user.proofOfWorkUrl} target="_blank" className="text-xs font-semibold px-4 py-2 bg-secondary/80 rounded-xl border border-border/50 hover:bg-secondary transition-colors inline-flex items-center gap-2 w-full justify-center">
                    Proof of Work
                  </a>
                </div>
              ))}
            </div>

            <div className="border-t border-border/50 pt-10">
              {activeQuest.status === "SHIPPED" ? (
                pendingReviewTeammates.length > 0 ? (
                  // Peer Review State
                  <div className="bg-secondary/20 p-8 rounded-2xl border border-border">
                    <h3 className="text-2xl font-bold mb-2">Peer Reviews Required</h3>
                    <p className="text-muted-foreground mb-6">Before you can finish this quest, review your teammates. Your review affects their global Trust Score.</p>
                    
                    <div className="space-y-4">
                      {pendingReviewTeammates.map(teammate => (
                        <div key={teammate.id} className="p-4 bg-background border border-border/50 rounded-xl flex items-center justify-between">
                          <span className="font-medium">{teammate.user.name}</span>
                          <form action={async (formData) => {
                            "use server";
                            const { submitReview } = await import("@/actions/review");
                            await submitReview(formData);
                          }} className="flex gap-2">
                            <input type="hidden" name="questId" value={activeQuest.id} />
                            <input type="hidden" name="revieweeId" value={teammate.userId} />
                            
                            <button type="submit" name="wouldWorkAgain" value="true" className="px-4 py-2 bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded-lg text-sm font-semibold transition-colors">
                              Would Work Again (+5)
                            </button>
                            <button type="submit" name="wouldWorkAgain" value="false" className="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg text-sm font-semibold transition-colors">
                              Flaked / Avoid (-10)
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Fully Completed State
                  <div className="space-y-6">
                    <div className="p-8 bg-green-500/5 rounded-2xl border border-green-500/20 text-center">
                      <p className="text-xl font-semibold text-green-400 mb-2">Quest Completed & Reviewed!</p>
                      <a href={activeQuest.shippedUrl!} target="_blank" className="text-muted-foreground hover:text-foreground transition-colors hover:underline">{activeQuest.shippedUrl}</a>
                    </div>
                    
                    {!user.username && (
                      <div className="p-8 bg-primary/5 rounded-2xl border border-primary/20 text-center">
                        <h3 className="text-xl font-bold mb-2">Claim Your Builder Handle</h3>
                        <p className="text-muted-foreground mb-6">Set a username to create your public portfolio and display this shipped project on your Collaboration Graph.</p>
                        <form action={async (formData) => {
                          "use server";
                          const { setUsername } = await import("@/actions/user");
                          await setUsername(formData);
                        }} className="flex gap-2 max-w-sm mx-auto">
                          <input required type="text" name="username" placeholder="johndoe" pattern="[a-zA-Z0-9_-]+" className="flex-1 px-4 py-3 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
                          <button type="submit" className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all">
                            Save
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )
              ) : (
                // Active State (Ship It)
                <>
                  <h3 className="text-2xl font-bold mb-3">Ship It 🚀</h3>
                  <form action={async (formData) => {
                    "use server";
                    const { submitProject } = await import("@/actions/quest");
                    await submitProject(formData);
                  }} className="flex flex-col gap-4 max-w-2xl">
                    <p className="text-muted-foreground text-sm mb-2">Paste the link to your finished project (GitHub, Live URL, Demo Video).</p>
                    <input type="hidden" name="questId" value={activeQuest.id} />
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input required type="url" name="shippedUrl" placeholder="https://..." className="flex-1 px-5 py-4 bg-background/50 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner" />
                      <button type="submit" className="px-8 py-4 bg-foreground text-background font-semibold rounded-2xl hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95 shadow-lg">
                        Submit Project
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 p-10 rounded-3xl shadow-2xl text-center">
            <h2 className="text-3xl font-bold mb-4 tracking-tight">The Weekend Draft</h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Opt-in to be manually matched with 2 other highly-vetted builders from your community this weekend.
            </p>

            {existingDraft ? (
              <div className="p-8 bg-primary/10 rounded-2xl border border-primary/20 flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
                <CheckCircle2 className="text-primary w-12 h-12" />
                <div>
                  <h3 className="font-bold text-xl mb-1">You are in the Draft!</h3>
                  <p className="text-sm text-muted-foreground">We will manually match you and update this page on Friday at 5 PM.</p>
                </div>
              </div>
            ) : (
              <form action={optIn} className="p-8 bg-background/50 rounded-2xl border border-border/50 max-w-md mx-auto shadow-sm">
                <h3 className="font-semibold text-xl mb-4">Ready to build?</h3>
                
                {(!user.skills || user.skills.length === 0) && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold mb-2">Select your primary skills:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Frontend", "Backend", "Design", "Product", "Mobile", "AI/ML"].map(skill => (
                        <label key={skill} className="flex items-center gap-2 text-sm bg-card p-2 rounded-lg border border-border/50 cursor-pointer hover:bg-secondary transition-colors">
                          <input type="checkbox" name="skills" value={skill} className="rounded text-primary focus:ring-primary/50" />
                          {skill}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <p className="text-sm font-semibold mb-2">Select your availability this weekend:</p>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm bg-card p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-secondary transition-colors">
                      <input type="checkbox" name="availability" value="Saturday" className="rounded text-primary focus:ring-primary/50" />
                      Saturday (All Day)
                    </label>
                    <label className="flex items-center gap-2 text-sm bg-card p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-secondary transition-colors">
                      <input type="checkbox" name="availability" value="Sunday" className="rounded text-primary focus:ring-primary/50" />
                      Sunday (All Day)
                    </label>
                  </div>
                </div>

                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="weekendId" value={UPCOMING_WEEKEND_ID} />
                
                <button className="w-full px-8 py-5 bg-foreground text-background rounded-2xl font-bold text-lg hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)]">
                  Opt-in for this Weekend
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
