import { useState } from "react";
import { EVENTS } from "./data";
import EventDetailsDialog from "./EventDetailsDialog";
import FlowingMenu from "./FlowingMenu";

export default function Events({ onRegister }) {
  const [activeEvent, setActiveEvent] = useState(null);

  const menuItems = EVENTS.map((e) => {
    let image = "";
    let marqueeBgColor = "";
    let marqueeTextColor = "#D9D2C4";

    switch (e.id) {
      case "Melodia":
        image = "https://i.pinimg.com/736x/b6/0d/07/b60d07e00a657cfef5f94e737527ccad.jpg";
        marqueeBgColor = "#fc2c08";
        break;
      case "invogue":
        image = "https://i.pinimg.com/736x/34/0f/63/340f6311462902c61c927004cdd869bb.jpg";
        marqueeBgColor = "#66C7F4";
        break;
      case "seismic":
        image = "https://i.pinimg.com/1200x/33/e0/d1/33e0d15448f85c2949ab8bdb6831954d.jpg";
        marqueeBgColor = "#D4E5FB";
        marqueeTextColor = "#1C1C2E";
        break;
      case "gourmet crusade":
        image = "https://i.pinimg.com/736x/03/72/43/0372436938c13820925c566edbdd5873.jpg";
        marqueeBgColor = "#5900ff";
        marqueeTextColor = "#FFFFFF";
        break;
      case "game f":
        image = "https://i.pinimg.com/1200x/b4/f0/a6/b4f0a6452ac38e93167ef248e29dbb28.jpg";
        marqueeBgColor = "#F6D8A8";
        marqueeTextColor = "#1C1C2E";
        break;
      default:
        image = "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&auto=format&fit=crop&q=60";
        marqueeBgColor = "#0A0A0A";
        marqueeTextColor = "#C6FF00";
    }

    return {
      text: e.name,
      link: "#",
      image,
      marqueeBgColor,
      marqueeTextColor,
      onClick: () => setActiveEvent(e)
    };
  });

  return (
    <section
      id="events"
      className="relative px-4 md:px-8 py-24 md:py-32"
      data-testid="events-section"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* section header */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12 md:mb-20">
          <div>
            <div className="font-mono-rdv text-xs text-[#66C7F4] dark:text-[#D4E5FB] uppercase tracking-widest mb-3">
              §02 ── PROGRAMMING
            </div>
            <h2
              className="font-display text-6xl md:text-8xl leading-[0.9]"
              data-testid="events-heading"
            >
              <span className="text-chrome">FIVE</span>
              <br />
              <span className="text-stroke-acid">EVENTS.</span>
              <br />
              <span className="text-[#66C7F4] dark:text-[#D4E5FB]">ONE WEEKEND.</span>
            </h2>
          </div>
          <p className="font-mono-rdv text-sm text-[#1C1C2E]/75 dark:text-[#D4E5FB]/60 max-w-md leading-relaxed">
            &gt; Choose your arena. Each event features its own judging panel and for those feeling bold, competing across multiple events is highly encouraged.
          </p>
        </div>

        {/* Flowing Menu */}
        <div className="border border-[#1C1C2E]/20 dark:border-[#D4E5FB]/10 p-1 md:p-2"
          style={{ background: "var(--flowing-bg)" }}>
          <FlowingMenu items={menuItems} />
        </div>

        {/* Action helper bar */}
        <div className="mt-6 flex flex-wrap justify-between gap-2 font-mono-rdv text-[11px] text-[#1C1C2E]/60 dark:text-[#D4E5FB]/40 uppercase tracking-widest px-1">
          <span>&gt; HOVER TO EXPLORE // CLICK TO VIEW RULES & ENTER</span>
          <span>RDV // VOL. 09</span>
        </div>

        {/* Controlled dialog popup */}
        {activeEvent && (
          <EventDetailsDialog
            event={activeEvent}
            open={!!activeEvent}
            onOpenChange={(open) => {
              if (!open) setActiveEvent(null);
            }}
            onRegister={onRegister}
          />
        )}
      </div>
    </section>
  );
}
