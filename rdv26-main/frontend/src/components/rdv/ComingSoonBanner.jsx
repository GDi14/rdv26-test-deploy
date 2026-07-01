import { motion } from "framer-motion";
import { Terminal, AlertTriangle } from "lucide-react";
import { FESTIVAL } from "./data";

export default function ComingSoonBanner() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-between bg-[#0A0A0C] text-[#F0EDE6] font-mono-rdv select-none overflow-hidden p-6 md:p-12">
      {/* Visual background noise / Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(rgba(252,44,8,1)_1px,transparent_1px),linear-gradient(90deg,rgba(252,44,8,1)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(252,44,8,0.06),rgba(0,0,0,0))] bg-[size:100%_4px,6px_100%]" />

      {/* Header HUD */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#fc2c08]/20 pb-4 text-xs uppercase tracking-widest">
        <div className="flex items-center gap-3">
          <span className="inline-block w-2 h-2 rounded-full bg-[#fc2c08] animate-ping" />
          <span className="font-bold text-white">SYS_MODE // OFFLINE_RECOVERY</span>
        </div>
        <div className="hidden sm:block text-white/40">
          FREQUENCY: {FESTIVAL.edition} // 2026
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center py-12 max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="flex items-center gap-2 text-[#fc2c08] bg-[#fc2c08]/10 border border-[#fc2c08]/30 px-3 py-1 text-[10px] tracking-[0.2em] uppercase font-bold">
            <AlertTriangle className="w-3.5 h-3.5" /> ACCESS_RESTRICTED
          </div>
          
          <h1 className="font-display text-[9vw] sm:text-[6vw] leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40 select-none uppercase">
            {FESTIVAL.name}
          </h1>
        </motion.div>

        {/* Glitch Coming Soon block */}
        <div className="relative border border-white/10 bg-white/[0.02] p-8 md:p-12 w-full max-w-2xl backdrop-blur-sm">
          <div className="absolute top-0 left-0 bg-[#fc2c08] text-black text-[9px] px-2 py-0.5 font-bold tracking-widest">
            STATUS_CODE: 303
          </div>
          <div className="absolute bottom-0 right-0 border-r border-b border-white/40 w-4 h-4" />
          
          <div className="space-y-6">
            <motion.h2 
              animate={{ 
                textShadow: [
                  "0 0 0px rgba(252,44,8,0)",
                  "2px -1px 0px rgba(252,44,8,0.8), -2px 1px 0px rgba(102,199,244,0.8)",
                  "0 0 0px rgba(252,44,8,0)"
                ] 
              }}
              transition={{ repeat: Infinity, duration: 2, repeatType: "mirror" }}
              className="text-4xl sm:text-6xl font-bold uppercase tracking-wider text-white"
            >
              COMING SOON
            </motion.h2>
            <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto uppercase tracking-wide leading-relaxed">
              We are currently fine-tuning our frequencies for {FESTIVAL.edition}. Online registration and the full digital experience will commence shortly.
            </p>
          </div>
        </div>

        {/* Additional decorative status info */}
        <div className="flex items-center gap-3 text-[10px] text-white/40 uppercase tracking-widest">
          <Terminal className="w-3.5 h-3.5 text-[#fc2c08]" />
          <span>INITIALIZING: {FESTIVAL.dates} // {FESTIVAL.venue}</span>
        </div>
      </div>

      {/* Footer HUD */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-white/10 pt-4 text-[10px] text-white/30 uppercase tracking-widest gap-2">
        <div>◆ BATCH OF 27 // SV27</div>
        <div className="text-right">ONE FREQUENCY. FIVE EVENTS. ONE WEEKEND.</div>
      </div>
    </div>
  );
}
