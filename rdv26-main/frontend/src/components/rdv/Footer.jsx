import { useState, useEffect } from "react";
import { FESTIVAL } from "./data";

export default function Footer() {
  const calculateTimeLeft = () => {
    // FESTIVAL.dates is "JUL 27 2026", FESTIVAL.year is "2026"
    // Let's parse it safely:
    const targetDate = new Date(`${FESTIVAL.dates} 00:00:00`);
    const difference = +targetDate - +new Date();
    
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      completed: false
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        completed: false
      };
    } else {
      timeLeft.completed = true;
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

        {/* Countdown Area */}
        <div 
          className="mt-12 mb-8 border border-[#1C1C2E]/20 dark:border-[#F0EDE6]/15 bg-black/5 dark:bg-black/20 p-6 md:p-8 font-mono-rdv select-none relative overflow-hidden" 
          data-testid="footer-countdown"
        >
          {/* Decorative grid pattern inside the box */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none bg-[linear-gradient(rgba(28,28,46,1)_1px,transparent_1px),linear-gradient(90deg,rgba(28,28,46,1)_1px,transparent_1px)] bg-[size:16px_16px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#fc2c08] font-bold">
                <span className="inline-block w-2.5 h-2.5 bg-[#fc2c08] animate-ping rounded-full" />
                ◆ {timeLeft.completed ? "RDV IS HERE" : "GREAT THINGS TAKE TIME"}
              </div>
              <p className="text-sm uppercase tracking-widest text-[#1C1C2E]/80 dark:text-[#F0EDE6]/70 max-w-xl">
                {timeLeft.completed 
                  ? "RENDEZVOUS VOL. 04 HAS BEGUN." 
                  : "T-MINUS UNTIL THE ULTIMATE EVENT BEGINS.."}
              </p>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 md:self-end">
              {/* DAYS */}
              <div className="flex flex-col items-center">
                <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 bg-[#1C1C2E]/5 dark:bg-black/40 border border-[#1C1C2E]/25 dark:border-[#F0EDE6]/20 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter text-[#1C1C2E] dark:text-[#F0EDE6]">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <span className="mt-2 text-[10px] sm:text-xs tracking-widest text-[#1C1C2E]/60 dark:text-[#F0EDE6]/50 uppercase">DAYS</span>
              </div>
              
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1C1C2E]/40 dark:text-[#F0EDE6]/30 self-start mt-4 sm:mt-6">:</div>
              
              {/* HOURS */}
              <div className="flex flex-col items-center">
                <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 bg-[#1C1C2E]/5 dark:bg-black/40 border border-[#1C1C2E]/25 dark:border-[#F0EDE6]/20 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter text-[#1C1C2E] dark:text-[#F0EDE6]">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <span className="mt-2 text-[10px] sm:text-xs tracking-widest text-[#1C1C2E]/60 dark:text-[#F0EDE6]/50 uppercase">HOURS</span>
              </div>
              
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1C1C2E]/40 dark:text-[#F0EDE6]/30 self-start mt-4 sm:mt-6">:</div>
              
              {/* MINUTES */}
              <div className="flex flex-col items-center">
                <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 bg-[#1C1C2E]/5 dark:bg-black/40 border border-[#1C1C2E]/25 dark:border-[#F0EDE6]/20 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter text-[#1C1C2E] dark:text-[#F0EDE6]">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <span className="mt-2 text-[10px] sm:text-xs tracking-widest text-[#1C1C2E]/60 dark:text-[#F0EDE6]/50 uppercase">MINUTES</span>
              </div>
              
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1C1C2E]/40 dark:text-[#F0EDE6]/30 self-start mt-4 sm:mt-6">:</div>
              
              {/* SECONDS */}
              <div className="flex flex-col items-center">
                <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 bg-[#fc2c08]/10 dark:bg-[#fc2c08]/20 border border-[#fc2c08] flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter text-[#fc2c08] animate-pulse">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <span className="mt-2 text-[10px] sm:text-xs tracking-widest text-[#fc2c08] uppercase font-bold">SECONDS</span>
              </div>
            </div>
          </div>
        </div>

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
