import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FESTIVAL } from "./data";
import { ArrowDownRight, Sparkles } from "lucide-react";
import Waves from "./Waves";

const CHROME =
  "https://images.unsplash.com/photo-1678782307359-064ba12b45ba?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwyfHxzaWx2ZXIlMjBjaHJvbWUlMjAzZCUyMHNoYXBlc3xlbnwwfHx8fDE3ODA3NjgzNjZ8MA&ixlib=rb-4.1.0&q=85";
const CHROME2 =
  "https://images.unsplash.com/photo-1739056238818-d00d80f0f842?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwzfHxzaWx2ZXIlMjBjaHJvbWUlMjAzZCUyMHNoYXBlc3xlbnwwfHx8fDE3ODA3NjgzNjZ8MA&ixlib=rb-4.1.0&q=85";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[100dvh] w-full pt-24 px-4 md:px-8 overflow-hidden"
      data-testid="hero-section"
    >
      {/* Waves background */}
      <Waves
        lineColor="#D4E5FB"
        backgroundColor="transparent"
        waveSpeedX={0.0125}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
      />

      {/* floating chrome 3D images */}
      <motion.img
        src={CHROME}
        alt=""
        className="absolute right-[-80px] top-[10%] w-[320px] md:w-[460px] float-y opacity-95 pointer-events-none select-none"
        style={{ filter: "invert(1)", mixBlendMode: "multiply" }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
      />
      <motion.img
        src={CHROME2}
        alt=""
        className="absolute left-[-50px] bottom-[5%] w-[200px] md:w-[280px] float-y opacity-75 pointer-events-none select-none"
        style={{ filter: "invert(1)", mixBlendMode: "multiply" }}
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.4, delay: 0.3 }}
      />

      {/* corner brackets */}
      <div className="hidden md:block absolute top-24 left-8 font-mono-rdv text-xs text-[#1C1C2E]/60 dark:text-[#D4E5FB]/50">
        ┌─ TRANSMISSION_001 ──────────
      </div>
      <div className="hidden md:block absolute bottom-8 right-8 font-mono-rdv text-xs text-[#1C1C2E]/60 dark:text-[#D4E5FB]/50">
        ── EOF // CODE_RDV_2026 ─┘
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto">
        {/* meta bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 text-left font-mono-rdv text-xs uppercase tracking-widest text-[#1C1C2E]/80 dark:text-[#D4E5FB]/70 border-y border-[#1C1C2E]/25 dark:border-[#D4E5FB]/15 py-2"
          data-testid="hero-meta"
        >
          <span>◉ {FESTIVAL.edition}</span>
          <span>{FESTIVAL.dates}</span>
          <span>{FESTIVAL.venue}</span>
          <span className="text-[#66C7F4] dark:text-[#D4E5FB]">◆ LIVE_FEED ACTIVE</span>
        </motion.div>

        {/* MEGA TITLE */}
        <div className="mt-12 md:mt-20">
          <motion.h1
            className="font-display leading-[0.82] tracking-tighter"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <span
              className="block text-[18vw] md:text-[14vw] text-chrome"
              data-testid="hero-title-main"
            >
              RENDEZ
            </span>
            <span className="flex items-baseline gap-3 md:gap-6 mt-[-2vw]">
              <span
                className="text-[18vw] md:text-[14vw] text-stroke-acid glitch"
                data-text="VOUS"
              >
                VOUS
              </span>
              <span
                className="text-[6vw] md:text-[3.5vw] text-[#05998c] rotate-y2k-a font-display"
                data-testid="hero-edition-stamp"
              >
                ✱{FESTIVAL.edition}
              </span>
            </span>
          </motion.h1>
        </div>

        {/* tagline + cta */}
        <div className="mt-10 md:mt-14 grid md:grid-cols-12 gap-6 md:gap-10 items-end">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="md:col-span-6 font-mono-rdv text-sm md:text-base text-[#1C1C2E]/85 dark:text-[#D4E5FB]/75 leading-relaxed max-w-xl"
            data-testid="hero-description"
          >
            &gt; A world beyond the ordinary is about to unfold. Rendezvous 2K26 invites you to step into an arena where imagination knows no boundaries, ambition fuels every challenge and every moment carries the promise of something extraordinary.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="md:col-span-6 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/register"
              data-testid="hero-cta-register"
              className="group inline-flex items-center gap-3 bg-[#05998c] text-white font-display text-lg md:text-2xl px-6 md:px-8 py-4 shadow-brutal hover:translate-x-[-4px] hover:translate-y-[-4px] transition-transform"
            >
              REGISTER NOW
              <ArrowDownRight className="w-6 h-6 group-hover:rotate-45 transition-transform" />
            </Link>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
