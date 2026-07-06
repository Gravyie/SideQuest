import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const username = resolvedParams.username.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      questMembers: {
        include: {
          quest: {
            include: {
              members: {
                include: { user: true }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    notFound();
  }

  // Calculate Shipped Quests
  const shippedQuests = user.questMembers
    .map(qm => qm.quest)
    .filter(q => q.status === "SHIPPED")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Calculate Collaboration Graph (Teammates from shipped quests)
  const collaboratorsMap = new Map<string, any>();
  
  shippedQuests.forEach(quest => {
    quest.members.forEach(member => {
      if (member.userId !== user.id) {
        if (!collaboratorsMap.has(member.userId)) {
          collaboratorsMap.set(member.userId, {
            ...member.user,
            collabCount: 1
          });
        } else {
          const existing = collaboratorsMap.get(member.userId);
          existing.collabCount += 1;
        }
      }
    });
  });

  const collaborators = Array.from(collaboratorsMap.values()).sort((a, b) => b.collabCount - a.collabCount);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>

      <main className="max-w-5xl mx-auto px-6 py-20 relative z-10">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline mb-8 inline-block">← Back to SideQuest</Link>
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-card/40 backdrop-blur-xl border border-border/50 p-10 rounded-3xl shadow-xl mb-12">
          <div>
            <h1 className="text-5xl font-bold tracking-tight mb-2">{user.name}</h1>
            <p className="text-xl text-muted-foreground">@{user.username}</p>
            <div className="flex items-center gap-4 mt-6">
              <span className="px-4 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                {user.community}
              </span>
              <a href={user.proofOfWorkUrl} target="_blank" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                Proof of Work ↗
              </a>
            </div>
          </div>
          
          <div className="text-left md:text-right p-6 bg-background/50 rounded-2xl border border-border/50 min-w-[200px]">
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mb-1">Trust Score</p>
            <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-500">
              {user.trustScore}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Column: Quests */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              Shipped Quests <span className="text-muted-foreground font-normal text-lg">({shippedQuests.length})</span>
            </h2>
            
            {shippedQuests.length === 0 ? (
              <div className="p-8 bg-secondary/20 rounded-2xl border border-border/50 text-center">
                <p className="text-muted-foreground">This builder hasn't shipped any quests yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {shippedQuests.map(quest => (
                  <div key={quest.id} className="p-8 bg-card/20 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Weekend of {quest.weekendId}</p>
                        <h3 className="text-xl font-bold">Shipped Project</h3>
                      </div>
                      <a href={quest.shippedUrl!} target="_blank" className="px-4 py-2 bg-foreground text-background font-semibold rounded-lg text-sm hover:scale-105 transition-transform">
                        View Project ↗
                      </a>
                    </div>
                    <div className="flex -space-x-4 mt-6">
                      {quest.members.map(m => (
                        <div key={m.id} className="w-10 h-10 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-bold ring-2 ring-transparent hover:ring-primary hover:z-10 transition-all cursor-help" title={m.user.name}>
                          {m.user.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Collaboration Graph */}
          <div>
            <h2 className="text-2xl font-bold mb-6">The Tribe</h2>
            {collaborators.length === 0 ? (
               <div className="p-8 bg-secondary/20 rounded-2xl border border-border/50 text-center text-sm text-muted-foreground">
                 No collaborators yet.
               </div>
            ) : (
              <div className="space-y-4">
                {collaborators.map(collab => (
                  <div key={collab.id} className="p-4 bg-card/20 backdrop-blur-sm rounded-xl border border-border/50 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{collab.name}</p>
                      {collab.username && (
                        <a href={`/u/${collab.username}`} className="text-xs text-primary hover:underline">@{collab.username}</a>
                      )}
                    </div>
                    <div className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                      {collab.collabCount} {collab.collabCount === 1 ? 'Quest' : 'Quests'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
