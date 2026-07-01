import { useState } from "react";
import { toast } from "sonner";
import { EVENT_COORDINATORS } from "./data";
import { Phone, Copy, Check } from "lucide-react";

export default function Contact() {
  return (
    <section
      id="contact"
      className="relative px-4 md:px-8 py-24 md:py-32"
      data-testid="contact-section"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="font-mono-rdv text-xs text-[#3A50A0] dark:text-[#7B8DB7] uppercase tracking-widest mb-3">
          §04 ── COMMAND_GRID
        </div>
        <h2 className="font-display text-6xl md:text-9xl leading-[0.85]">
          <span className="text-stroke-white">CONTACTS</span>{" "}
          <span className="text-[#05998c]">.</span>
        </h2>

        <div className="mt-12 md:mt-20 space-y-4 md:space-y-6">
          {EVENT_COORDINATORS.map((row, ri) => (
            <div
              key={ri}
              className={`grid gap-4 md:gap-6 ${
                row.items.length === 2
                  ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
                  : "grid-cols-1 md:grid-cols-3"
              }`}
            >
              {row.items.map((coord, ci) => (
                <CoordinatorCard
                  key={ci}
                  coordinator={coord}
                  index={ri * 3 + ci}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoordinatorCard({ coordinator, index }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = [
      coordinator.role,
      ...coordinator.people.map(
        (p) => `${p.subrole}: ${p.name} — ${p.phone}`
      ),
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("COPIED TO CLIPBOARD");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="relative group border border-[#66C7F4]/20 dark:border-[#66C7F4]/20 bg-[#E8E4DC] dark:bg-[#0a0a1a]/80 p-5 md:p-6 transition-all duration-500 hover:border-[#66C7F4]/50 dark:hover:border-[#66C7F4]/50"
      style={{
        boxShadow:
          "inset 0 0 40px rgba(102,199,244,0.02), 0 0 20px rgba(102,199,244,0.04)",
      }}
      data-testid={`coordinator-card-${index}`}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#66C7F4]/40 transition-colors duration-300 group-hover:border-[#66C7F4]/70" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#66C7F4]/40 transition-colors duration-300 group-hover:border-[#66C7F4]/70" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#66C7F4]/40 transition-colors duration-300 group-hover:border-[#66C7F4]/70" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#66C7F4]/40 transition-colors duration-300 group-hover:border-[#66C7F4]/70" />

      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow:
            "inset 0 0 60px rgba(102,199,244,0.06), 0 0 30px rgba(102,199,244,0.08)",
        }}
      />

      <div className="relative z-10">
        {/* Event name header */}
        <div className="font-display text-lg md:text-xl leading-tight text-[#1C1C2E] dark:text-[#66C7F4] mb-4">
          {coordinator.role}
        </div>

        {/* People list */}
        <div className="space-y-3 mb-4">
          {coordinator.people.map((person, i) => (
            <div key={i}>
              <div className="font-mono-rdv text-[9px] uppercase tracking-[0.2em] text-[#3A50A0] dark:text-[#66C7F4]/50 mb-0.5">
                ◆ {person.subrole}
              </div>
              <div className="font-display text-sm leading-tight text-[#1C1C2E] dark:text-[#F0EDE6]">
                {person.name}
              </div>
              <div className="flex items-center gap-1.5 font-mono-rdv text-[11px] text-[#1C1C2E]/55 dark:text-[#F0EDE6]/45 mt-0.5">
                <Phone className="w-2.5 h-2.5" />
                {person.phone}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 border border-[#1C1C2E]/25 dark:border-[#66C7F4]/25 text-[#1C1C2E]/70 dark:text-[#66C7F4]/70 hover:border-[#66C7F4] hover:text-[#66C7F4] px-3 py-1.5 font-mono-rdv text-[10px] uppercase tracking-widest transition-all duration-200"
          data-testid={`coordinator-copy-${index}`}
        >
          {copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
