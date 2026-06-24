import React, { useEffect } from "react";
import Navbar from "@/components/rdv/Navbar";

export default function GalleryPage() {
  useEffect(() => {
    document.title = "Gallery - RDV26";
  }, []);

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden" data-testid="gallery-root">
      {/* Navbar overlay */}
      <Navbar />

      {/* WebGL Gallery Iframe */}
      <iframe
        src="/clean/index.html"
        title="Projects Gallery"
        className="w-full h-full border-none block"
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          border: "none",
          zIndex: 10,
          background: "transparent",
        }}
      />
    </main>
  );
}

