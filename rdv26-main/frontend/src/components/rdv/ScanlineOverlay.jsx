export default function ScanlineOverlay() {
  return (
    <>
      {/* Inline SVG filter: barrel/pincushion lens warp */}
      <svg
        className="rdv-crt-svg-filter"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="crt-barrel" x="-5%" y="-5%" width="110%" height="110%">
            {/* feTurbulence generates a radial-ish noise map */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.016 0.012"
              numOctaves="1"
              seed="3"
              result="noise"
            />
            {/* feDisplacementMap uses the noise channels to push pixels outward */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="18"
              xChannelSelector="R"
              yChannelSelector="G"
              result="warped"
            />
            {/* slight composite blur on top to sell the phosphor haze */}
            <feGaussianBlur in="warped" stdDeviation="0.35" />
          </filter>
        </defs>
      </svg>

      {/* CRT overlay layers */}
      <div className="rdv-crt-overlay" aria-hidden="true" data-testid="scanline-overlay">
        <div className="rdv-crt-hazey" />
        <div className="rdv-crt-halftone" />
        <div className="rdv-crt-scanlines" />
        <div className="rdv-crt-phosphors" />
        <div className="rdv-crt-reflection" />
        <div className="rdv-crt-vignette" />
        <div className="rdv-crt-screen-corners" />
        <div className="rdv-crt-flicker" />
      </div>
    </>
  );
}
