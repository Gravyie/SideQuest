"use client";

import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Premium Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: "2s" }}></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <main className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/80 backdrop-blur-md border border-border/50 text-sm font-medium text-muted-foreground mb-8 shadow-sm"
        >
          <Terminal size={14} className="text-primary" />
          <span>SideQuest v1.0.0-beta</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent leading-tight"
        >
          Multiplayer mode <br className="hidden md:block"/> for real life.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-2xl text-muted-foreground mb-12 max-w-2xl font-light leading-relaxed"
        >
          Find your tribe and build something meaningful in 72 hours. No endless feeds. No ghosting. Just raw execution.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link
            href="/waitlist"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
          >
            Request Access <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium rounded-2xl bg-secondary/50 backdrop-blur-md border border-border text-foreground hover:bg-secondary/80 transition-all hover:scale-105 active:scale-95"
          >
            Member Login
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full"
        >
          {[
            { step: "01", title: "Opt In", desc: "Tell us you're free this weekend. Share your motivation." },
            { step: "02", title: "Get Matched", desc: "We curate the perfect 3-person squad for you by Friday 5PM." },
            { step: "03", title: "Ship It", desc: "Meet up. Build something real. Submit your proof of work on Sunday." }
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-2xl bg-secondary/20 backdrop-blur-xl border border-border/50 hover:bg-secondary/40 transition-colors">
              <div className="text-sm font-mono text-primary mb-4">{item.step}</div>
              <h3 className="font-semibold text-xl mb-2 tracking-tight">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
