"use client";

import { useActionState } from "react";
import { joinWaitlist } from "@/actions/waitlist";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function WaitlistPage() {
  const [state, formAction, isPending] = useActionState(joinWaitlist, { success: false, error: "", message: "" } as any);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <main className="relative z-10 w-full max-w-md bg-card/60 backdrop-blur-xl border border-border/50 p-8 sm:p-10 rounded-[2rem] shadow-2xl">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to Home
        </Link>

        {state.success ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold tracking-tight mb-3">You're on the list.</h2>
            <p className="text-muted-foreground mb-10 leading-relaxed text-lg">We manually review every application to ensure high-quality matches. We'll email you when you're approved.</p>
            <Link href="/" className="px-8 py-4 bg-secondary text-secondary-foreground rounded-2xl font-semibold hover:bg-secondary/80 transition-all inline-block w-full">
              Return Home
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-3 tracking-tight">Request Access</h1>
            <p className="text-muted-foreground mb-10 text-base leading-relaxed">SideQuest is currently invite-only. Apply below with your proof of work.</p>

            <form action={formAction} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2.5">
                <label htmlFor="name" className="text-sm font-semibold tracking-wide text-foreground/80">Full Name</label>
                <input required type="text" id="name" name="name" placeholder="John Doe" className="px-5 py-4 bg-background/50 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner transition-all" />
              </div>

              <div className="flex flex-col gap-2.5">
                <label htmlFor="email" className="text-sm font-semibold tracking-wide text-foreground/80">Email Address</label>
                <input required type="email" id="email" name="email" placeholder="john@example.com" className="px-5 py-4 bg-background/50 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner transition-all" />
              </div>

              <div className="flex flex-col gap-2.5">
                <label htmlFor="community" className="text-sm font-semibold tracking-wide text-foreground/80">Your Community</label>
                <input required type="text" id="community" name="community" placeholder="e.g. Buildspace, Stanford, IIT Delhi" className="px-5 py-4 bg-background/50 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner transition-all" />
              </div>

              <div className="flex flex-col gap-2.5">
                <label htmlFor="proofOfWorkUrl" className="text-sm font-semibold tracking-wide text-foreground/80">Proof of Work (URL)</label>
                <input required type="url" id="proofOfWorkUrl" name="proofOfWorkUrl" placeholder="GitHub, Portfolio, LinkedIn" className="px-5 py-4 bg-background/50 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner transition-all" />
              </div>

              <div className="flex flex-col gap-2.5">
                <label htmlFor="motivation" className="text-sm font-semibold tracking-wide text-foreground/80">What do you want from this weekend?</label>
                <textarea required id="motivation" name="motivation" rows={4} placeholder="I want to ship a real product with a great backend engineer..." className="px-5 py-4 bg-background/50 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none shadow-inner transition-all"></textarea>
              </div>

              {state.error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-medium text-sm">
                  {state.error}
                </div>
              )}

              <button disabled={isPending} type="submit" className="mt-4 w-full py-5 bg-foreground text-background rounded-2xl font-bold text-lg hover:bg-foreground/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center shadow-[0_0_30px_-10px_rgba(255,255,255,0.2)]">
                {isPending ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
