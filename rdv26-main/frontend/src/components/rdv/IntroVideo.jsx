import { useEffect, useRef, useState } from "react";

export default function IntroVideo({ onStartFade, onComplete }) {
  const [isFading, setIsFading] = useState(false);
  const [isPortrait, setIsPortrait] = useState(
    () => window.innerHeight > window.innerWidth
  );
  const videoRef = useRef(null);
  const timeoutRef = useRef(null);

  // Update orientation on resize
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleStartFade = () => {
    if (isFading) return;
    setIsFading(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (onStartFade) {
      onStartFade();
    }

    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1000);
  };

  useEffect(() => {
    // Safety timeout: Auto-skip if video hasn't started playing within 5 seconds
    // (covers slow loading, network errors, or custom autoplay blocks)
    timeoutRef.current = setTimeout(() => {
      console.warn("Autoplay stalled/timed out, transitioning to site.");
      handleStartFade();
    }, 5000);

    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Mobile autoplay failed or blocked:", err);
          handleStartFade();
        });
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePlaying = () => {
    // Clear safety timeout as soon as the video successfully begins playing
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <div
      onClick={handleStartFade}
      style={{ width: "100dvw", height: "100dvh" }}
      className={`fixed inset-0 z-[9990] bg-black select-none overflow-hidden transition-opacity duration-1000 ease-out cursor-pointer ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      data-testid="intro-video-container"
    >
      <video
        ref={videoRef}
        src="/assets/pre-grade (1).mp4"
        /* On portrait/mobile use object-contain so the full video is visible;
           on landscape/desktop use object-cover for a cinematic fill. */
        className={`w-full h-full ${isPortrait ? "object-contain" : "object-cover"}`}
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        preload="auto"
        onPlaying={handlePlaying}
        onEnded={handleStartFade}
      />

      {/* Tap-to-skip hint — visible on touch devices only */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-white/40 text-[10px] uppercase tracking-[0.3em] pointer-events-none transition-opacity duration-700 ${
          isFading ? "opacity-0" : "opacity-100"
        }`}
        style={{ fontFamily: "JetBrains Mono, monospace" }}
      >
        tap to skip
      </div>
    </div>
  );
}
