import Marquee from "react-fast-marquee";
import { Asterisk } from "lucide-react";

export default function MarqueeStrip({
  items = [],
  speed = 60,
  bg = "#0a0a0a",
  color = "#C6FF00",
  direction = "left",
  className = "",
  borderColor = "#C6FF00",
}) {
  return (
    <div
      className={`marquee-strip ${className}`}
      style={{
        background: bg,
        borderTop: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        color,
      }}
      data-testid="marquee-strip"
    >
      <Marquee speed={speed} gradient={false} direction={direction} pauseOnHover={false}>
        {items.concat(items).map((t, i) => (
          <span
            key={i}
            className="font-display text-2xl md:text-4xl py-3 px-6 inline-flex items-center gap-6"
          >
            {t}
            <Asterisk className="w-5 h-5 md:w-7 md:h-7" style={{ color }} />
          </span>
        ))}
      </Marquee>
    </div>
  );
}
