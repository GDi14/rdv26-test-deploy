import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FESTIVAL } from "./data";
import { Sun, Moon } from "lucide-react";
import StaggeredMenu from "./StaggeredMenu";
import "./StaggeredMenu.css";

// 1×1 transparent GIF — satisfies the required logoUrl prop without rendering anything
// (the .sm-logo slot is hidden via CSS overrides; we render our own logo overlay below)
const BLANK_IMG =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const MENU_ITEMS = [
  { label: "Home",     ariaLabel: "Go to home",        link: "/"         },
  { label: "Events",   ariaLabel: "Go to events",      link: "/events"   },
  { label: "Gallery",  ariaLabel: "Go to gallery",      link: "/gallery"  },
  { label: "Register", ariaLabel: "Go to registration", link: "/register" },
  { label: "Contact",  ariaLabel: "Contact us",         link: "/contact"  },
];

const SOCIAL_ITEMS = [
  { label: "Instagram", link: "https://www.instagram.com/rendezvous.2026?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" },
  { label: "YouTube",   link: "https://youtube.com/@rdv.2k26?si=mPQjBNf27ivKSz_b" },
];

export default function Navbar() {
  const [time, setTime] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  // Live clock
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Apply / persist theme
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // Toggle-button colour adapts to theme; white when menu is open (panel behind it)
  const menuButtonColor = theme === "dark" ? "#D9D2C4" : "#1C1C2E";

  // Logo text colour: white while panel is animating in (pre-layers are coloured),
  // otherwise it follows the current theme.
  const logoTextClass = menuOpen
    ? "text-white"
    : "text-[#1C1C2E] dark:text-[#D4E5FB]";

  return (
    <>
      {/*
        Logo + utilities overlay
        ─────────────────────────────────────────────────────────────────────
        z-[51] puts this above the StaggeredMenu's fixed wrapper (z-40) so
        the logo stays visible over the panel on mobile full-width layouts.
        padding matches .staggered-menu-header { padding: 2em } at 16px root.
      */}
      <div
        className="fixed top-0 left-0 z-[51] flex items-center gap-3 pointer-events-none p-5 md:p-8"
        data-testid="rdv-navbar"
      >
        {/* Brand / logo */}
        <Link
          to="/"
          className={`font-display text-lg md:text-2xl tracking-tighter glitch pointer-events-auto transition-colors duration-200 ${logoTextClass}`}
          data-text={FESTIVAL.short}
          data-testid="navbar-logo"
        >
          {FESTIVAL.short}
          <span className="text-[#05998c]">/</span>
          {FESTIVAL.year}
        </Link>


        {/* Live clock (desktop only) */}
        <span
          className={`hidden md:inline font-mono-rdv text-[10px] tracking-widest uppercase transition-colors duration-200 ${logoTextClass}`}
          data-testid="navbar-clock"
        >
          {time}&nbsp;IST
        </span>

        {/* Dark-mode toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={`pointer-events-auto flex items-center justify-center p-1.5 border rounded-none transition-colors
            ${menuOpen
              ? "border-white/40 text-white hover:border-white"
              : "border-[#1C1C2E]/20 dark:border-[#D4E5FB]/20 text-[#1C1C2E] dark:text-[#D4E5FB] hover:border-[#05998c] dark:hover:border-[#05998c]"
            } font-mono-rdv`}
        >
          {theme === "light" ? (
            <Moon className="w-3.5 h-3.5" />
          ) : (
            <Sun className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/*
        StaggeredMenu — GSAP-powered slide-in panel
        ─────────────────────────────────────────────────────────────────────
        isFixed={true}  →  component manages its own fixed positioning
        colors          →  pre-layer stagger: brand blue then brand dark
        accentColor     →  item hover + numbering colour = RDV orange
      */}
      <StaggeredMenu
        isFixed={true}
        position="right"
        colors={["#66C7F4", "#1A1A2E"]}
        items={MENU_ITEMS}
        socialItems={SOCIAL_ITEMS}
        displaySocials={true}
        displayItemNumbering={true}
        logoUrl={BLANK_IMG}
        menuButtonColor={menuButtonColor}
        openMenuButtonColor="#ffffff"
        accentColor="#05998c"
        changeMenuColorOnOpen={true}
        closeOnClickAway={true}
        onMenuOpen={() => setMenuOpen(true)}
        onMenuClose={() => setMenuOpen(false)}
      />
    </>
  );
}
