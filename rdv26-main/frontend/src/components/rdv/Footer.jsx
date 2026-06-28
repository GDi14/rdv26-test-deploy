import { FESTIVAL } from "./data";
import GlitchVisualizer from "./GlitchVisualizer";

export default function Footer() {
  return (
    <footer
      className="relative px-4 md:px-8 pt-20 pb-10 border-t border-[#1C1C2E]/15 dark:border-[#F0EDE6]/10"
      data-testid="rdv-footer"
    >
      <div className="max-w-[1400px] mx-auto">
        <h3
          className="font-display leading-[0.78] tracking-tighter text-[13vw] sm:text-[18vw] text-stroke-white dark:text-stroke-white-dark"
          data-testid="footer-mega"
        >
          {FESTIVAL.name}
        </h3>

        {/* Glitch Visualizer Experience replacing countdown timer */}
        <GlitchVisualizer />

        <div className="mt-10 grid md:grid-cols-3 gap-6 font-mono-rdv text-xs uppercase tracking-widest text-[#1C1C2E]/65 dark:text-[#F0EDE6]/45">
          <div>
            ◆ {FESTIVAL.edition}
            <br />
            <span className="text-[#1C1C2E] dark:text-[#F0EDE6]">{FESTIVAL.tagline}</span>
          </div>
          <div>
            ◆ DATE
            <br />
            <span className="text-[#1C1C2E] dark:text-[#F0EDE6]">{FESTIVAL.dates} // {FESTIVAL.year}</span>
          </div>
          <div className="md:text-right">
            ◆ © {FESTIVAL.year} BATCH OF 27
            <br />
            <span className="text-[#1C1C2E] dark:text-[#F0EDE6]">SV27</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
