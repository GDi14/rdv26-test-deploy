import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Phone, ScrollText } from "lucide-react";

export default function EventDetailsDialog({ event, trigger, open, onOpenChange, onRegister }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className="bg-black border max-w-3xl max-h-[85vh] overflow-y-auto p-0 rounded-none"
        style={{ borderColor: event.color, boxShadow: `8px 8px 0 0 ${event.color}` }}
        data-testid={`event-dialog-${event.id}`}
      >
        {/* HEADER */}
        <div
          className="px-6 md:px-8 py-5 pr-12 md:pr-16 border-b flex items-center justify-between"
          style={{ borderColor: `${event.color}55` }}
        >
          <div>
            <div
              className="font-mono-rdv text-xs uppercase tracking-widest mb-1"
              style={{ color: event.color }}
            >
              ◆ {event.category} // {event.tagline}
            </div>
            <h3
              className="font-display text-3xl md:text-5xl leading-none"
              style={{ color: event.color }}
              data-testid={`event-dialog-title-${event.id}`}
            >
              {event.name}
            </h3>
          </div>
          <span
            className="hidden sm:inline-flex bg-white text-black px-3 py-1 font-mono-rdv text-xs"
          >
            /{event.code}
          </span>
        </div>

        {/* BODY */}
        <div className="bg-white/10">
          {/* MEDIA / POSTER BOX */}
          <div className="flex flex-col gap-px bg-white/10">
            <section className="bg-[#0A0A0A] p-6 border-b border-white/5" style={{ borderColor: `${event.color}33` }}>
              <div className="flex items-center justify-between mb-4 font-mono-rdv text-[9px] uppercase tracking-widest text-white/30">
                <span>SIGNAL // {event.id}.JPG</span>
                <span className="flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  ENCRYPTED
                </span>
              </div>
              
              <div className="max-w-[280px] mx-auto aspect-square relative border border-white/10 bg-black/40 group overflow-hidden shadow-2xl">
                {event.poster ? (
                  <img 
                    src={event.poster} 
                    alt={event.name} 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center scanlines">
                    <div className="text-white/10 font-display text-2xl mb-2 tracking-[0.2em]">REDACTED</div>
                    <div className="font-mono-rdv text-[8px] text-[#05998c]/40 leading-tight">
                      &gt; [ACCESS_DENIED]
                      <br />
                      &gt; KEY_REQUIRED
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none border-[8px] border-black/20" />
                <div className="absolute bottom-2 right-2 font-mono-rdv text-[7px] text-white/20">
                  REF_0{event.code}
                </div>
              </div>

              <div className="mt-4 font-mono-rdv text-[10px] text-center text-white/40 uppercase tracking-widest leading-relaxed">
                {event.poster ? "SOURCE: DECRYPTION_SUCCESS" : "AWAITING BROADCAST SIGNAL"}
              </div>
            </section>

            {/* RULES (Moved inside the first column) */}
            <section className="bg-black p-6 md:p-8 flex-1 border-t border-white/5" data-testid={`event-rules-${event.id}`}>
              <div className="flex items-center gap-2 mb-5 font-mono-rdv text-xs uppercase tracking-widest text-white/60">
                <ScrollText className="w-4 h-4" style={{ color: event.color }} />
                §RULES_BOOK
              </div>
              <ol className="space-y-3 font-mono-rdv text-sm text-white/80 leading-relaxed">
                {event.rules.map((r, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="font-display text-base shrink-0"
                      style={{ color: event.color }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>


        </div>

        {/* FOOTER */}
        <div
          className="px-6 md:px-8 py-4 border-t flex flex-wrap gap-4 items-center justify-between font-mono-rdv text-xs uppercase tracking-widest"
          style={{ borderColor: `${event.color}55` }}
        >
          <span style={{ color: event.color }}>&gt; rdv://{event.id}/manifest.txt</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onRegister?.(event.id);
                onOpenChange?.(false);
              }}
              className="px-4 py-2 border font-bold hover:bg-white hover:text-black transition-colors"
              style={{ borderColor: event.color, color: event.color }}
            >
              ENTER EVENT →
            </button>
            <span className="text-white/40 hidden md:inline">PRESS [ESC] TO CLOSE</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
