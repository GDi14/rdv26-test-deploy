import { useState } from "react";
import Navbar from "@/components/rdv/Navbar";
import Hero from "@/components/rdv/Hero";
import Footer from "@/components/rdv/Footer";
import IntroVideo from "@/components/rdv/IntroVideo";

export default function Home() {
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem("rdv-intro-seen");
  });

  const [renderSite, setRenderSite] = useState(() => {
    return !!sessionStorage.getItem("rdv-intro-seen");
  });

  const handleStartFade = () => {
    setRenderSite(true);
  };

  const handleComplete = () => {
    sessionStorage.setItem("rdv-intro-seen", "true");
    setShowIntro(false);
  };

  return (
    <>
      {showIntro && (
        <IntroVideo onStartFade={handleStartFade} onComplete={handleComplete} />
      )}
      {renderSite && (
        <main className="relative" data-testid="home-root">
          <Navbar />
          <Hero />
          <Footer />
        </main>
      )}
    </>
  );
}

