import { useEffect, useRef, useState } from "react";
import { Camera, Terminal, AlertTriangle, RefreshCw, Download } from "lucide-react";
import { FESTIVAL } from "./data";

// Helper to dynamically load external scripts
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};

const MEDIAPIPE_POSE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js";

const phrases = [
  FESTIVAL.name,
  "RDV26",
  FESTIVAL.edition,
  FESTIVAL.tagline,
  "ITS THAT TIME OF THE YEAR",
  "ONE FREQUENCY",
  "SARVODAYA VIDYALAYA"
];

const boxColors = [
  { bg: '#05998c', fg: '#ffffff' }, // RDV Red
  { bg: '#f10b55', fg: '#000000' }, // Hot Pink
  { bg: '#c6f600', fg: '#000000' }, // Lime Green
  { bg: '#a347ff', fg: '#ffffff' }, // Purple
  { bg: '#ff4d00', fg: '#ffffff' }, // Orange
  { bg: '#000000', fg: '#c6f600' }, // Black & Lime
  { bg: '#d9d9d9', fg: '#000000' }  // Light Grey
];

export default function GlitchVisualizer() {
  const [status, setStatus] = useState("STANDBY"); // STANDBY, LOADING, ACTIVE, ERROR
  const [errorMsg, setErrorMsg] = useState("");
  const [isHandRaised, setIsHandRaised] = useState(false);

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const poseRef = useRef(null);
  const loopsRef = useRef({ detect: null, render: null });

  // Offscreen canvases for composite rendering
  const offCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const scanlineCanvasRef = useRef(null);

  // Box data for glitch effect
  const textBoxesRef = useRef([]);
  const lastGlitchTimeRef = useRef(0);

  const initCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Webcam APIs not supported in this browser");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  };

  const initAI = async () => {
    await loadScript(MEDIAPIPE_POSE_URL);
    if (!window.Pose) {
      throw new Error("Failed to load MediaPipe Pose library");
    }
    const pose = new window.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    poseRef.current = pose;
    await pose.initialize();
  };

  const handleStart = async () => {
    setStatus("LOADING");
    setErrorMsg("");
    try {
      // 1. Create helper canvases
      offCanvasRef.current = document.createElement("canvas");
      maskCanvasRef.current = document.createElement("canvas");
      scanlineCanvasRef.current = document.createElement("canvas");

      // Set up scanline pattern canvas
      scanlineCanvasRef.current.width = 1;
      scanlineCanvasRef.current.height = 4;
      const sCtx = scanlineCanvasRef.current.getContext("2d");
      sCtx.fillStyle = "rgba(0, 0, 0, 0.2)";
      sCtx.fillRect(0, 2, 1, 2);

      // 2. Start webcam
      await initCamera();

      // 3. Load and initialize MediaPipe
      await initAI();

      setStatus("ACTIVE");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to start visualizer");
      setStatus("ERROR");
      handleStop();
    }
  };

  const handleStop = () => {
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Cancel requestAnimationFrame loops
    if (loopsRef.current.detect) {
      cancelAnimationFrame(loopsRef.current.detect);
      loopsRef.current.detect = null;
    }
    if (loopsRef.current.render) {
      cancelAnimationFrame(loopsRef.current.render);
      loopsRef.current.render = null;
    }
    // Reset states
    poseRef.current = null;
    setIsHandRaised(false);
    if (status !== "ERROR") {
      setStatus("STANDBY");
    }
  };

  const handleCapture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `RDV26_capture_${timestamp}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Capture failed:", err);
    }
  };

  useEffect(() => {
    return () => {
      // Clean up webcam and loops on unmount
      handleStop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Configure loops when Pose model and Video are active
  useEffect(() => {
    if (status !== "ACTIVE" || !poseRef.current || !videoRef.current) return;

    const pose = poseRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    const offCanvas = offCanvasRef.current;
    const offCtx = offCanvas?.getContext("2d", { willReadFrequently: true });
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas?.getContext("2d", { willReadFrequently: true });

    let latestMask = null;
    let localIsHandRaised = false;

    pose.onResults((results) => {
      if (results.segmentationMask && maskCanvas && maskCtx) {
        maskCanvas.width = results.segmentationMask.width;
        maskCanvas.height = results.segmentationMask.height;
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        maskCtx.drawImage(results.segmentationMask, 0, 0);

        // Hard threshold the mask to eliminate fringing
        const imgData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        const data = imgData.data;
        for (let i = 3; i < data.length; i += 4) {
          data[i] = data[i] > 25 ? 255 : 0;
        }
        maskCtx.putImageData(imgData, 0, 0);
        latestMask = maskCanvas;
      }

      let raised = false;
      if (results.poseLandmarks) {
        const lw = results.poseLandmarks[15];
        const ls = results.poseLandmarks[11];
        const rw = results.poseLandmarks[16];
        const rs = results.poseLandmarks[12];
        if (lw && lw.visibility > 0.1 && lw.y < ls.y + 0.2) raised = true;
        if (rw && rw.visibility > 0.1 && rw.y < rs.y + 0.2) raised = true;
      }
      localIsHandRaised = raised;
      setIsHandRaised(raised);
    });

    let isDetecting = false;
    const detectionLoop = async () => {
      if (!isDetecting && video.readyState >= 2) {
        isDetecting = true;
        try {
          await pose.send({ image: video });
        } catch (e) {
          console.error("Pose detection loop error:", e);
        }
        isDetecting = false;
      }
      loopsRef.current.detect = requestAnimationFrame(detectionLoop);
    };

    const calculateObjectFitCover = (vidW, vidH, canW, canH) => {
      const vidRatio = vidW / vidH;
      const canRatio = canW / canH;
      let drawW, drawH, offsetX = 0, offsetY = 0;
      if (canRatio > vidRatio) {
        drawW = canW;
        drawH = canW / vidRatio;
        offsetY = (canH - drawH) / 2;
      } else {
        drawH = canH;
        drawW = canH * vidRatio;
        offsetX = (canW - drawW) / 2;
      }
      return { drawW, drawH, offsetX, offsetY };
    };

    const updateTextBoxes = (w, h, time) => {
      if (time - lastGlitchTimeRef.current > 80) {
        lastGlitchTimeRef.current = time;
        const boxes = [];
        const numBoxes = 300;
        for (let i = 0; i < numBoxes; i++) {
          boxes.push({
            text: phrases[Math.floor(Math.random() * phrases.length)],
            color: boxColors[Math.floor(Math.random() * boxColors.length)],
            x: Math.random() * w,
            y: Math.random() * h,
            fontSize: 16 + Math.random() * 40
          });
        }
        textBoxesRef.current = boxes;
      }
    };

    const renderLoop = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const time = performance.now();

      if (video.readyState >= 2) {
        const { drawW, drawH, offsetX, offsetY } = calculateObjectFitCover(video.videoWidth, video.videoHeight, w, h);

        // Draw normal mirrored video background
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, -offsetX, offsetY, drawW, drawH);
        ctx.restore();

        // Draw interactive cutout text layers
        if (localIsHandRaised && latestMask && offCanvas && offCtx) {
          ctx.save();

          offCtx.globalCompositeOperation = "source-over";
          offCtx.clearRect(0, 0, w, h);

          updateTextBoxes(w, h, time);

          offCtx.textAlign = "center";
          offCtx.textBaseline = "middle";
          for (let b of textBoxesRef.current) {
            offCtx.font = `bold ${b.fontSize}px monospace`;
            let metrics = offCtx.measureText(b.text);
            let bw = metrics.width + 12;
            let bh = b.fontSize + 6;
            offCtx.fillStyle = b.color.bg;
            offCtx.fillRect(b.x - bw / 2, b.y - bh / 2, bw, bh);
            offCtx.fillStyle = b.color.fg;
            offCtx.fillText(b.text, b.x, b.y);
          }

          // Clip to silhouette
          offCtx.globalCompositeOperation = "destination-in";
          offCtx.save();
          offCtx.translate(w, 0);
          offCtx.scale(-1, 1);
          offCtx.imageSmoothingEnabled = false;
          offCtx.drawImage(latestMask, -offsetX, offsetY, drawW, drawH);
          offCtx.restore();

          // Render onto canvas
          ctx.drawImage(offCanvas, 0, 0);
          ctx.restore();
        }

        // Draw scanlines
        if (scanlineCanvasRef.current) {
          ctx.save();
          const pattern = ctx.createPattern(scanlineCanvasRef.current, "repeat");
          if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, w, h);
          }
          ctx.restore();
        }
      }

      loopsRef.current.render = requestAnimationFrame(renderLoop);
    };

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height || 400;
      if (offCanvas) {
        offCanvas.width = canvas.width;
        offCanvas.height = canvas.height;
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Start loops
    detectionLoop();
    renderLoop();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [status]);

  return (
    <div className="relative border border-[#1C1C2E]/20 dark:border-[#F0EDE6]/15 bg-black/5 dark:bg-black/20 p-6 md:p-8 font-mono-rdv select-none overflow-hidden mt-12 mb-8">
      {/* Hidden video element used as canvas source, rendered unconditionally to avoid React ref race conditions */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* Decorative background grid */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none bg-[linear-gradient(rgba(28,28,46,1)_1px,transparent_1px),linear-gradient(90deg,rgba(28,28,46,1)_1px,transparent_1px)] bg-[size:16px_16px]" />
      
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#1C1C2E]/10 dark:border-[#F0EDE6]/10 pb-4">
          <div className="flex items-center gap-3">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-[#05998c]"}`} />
            <div className="text-xs uppercase tracking-widest font-bold text-[#1C1C2E] dark:text-[#F0EDE6]">
              ◆ INTERACTIVE_VISUAL_DAEMON // STATUS_{status}
            </div>
          </div>
          <div className="text-[10px] text-[#1C1C2E]/40 dark:text-[#F0EDE6]/45 uppercase">
            {status === "ACTIVE" && `HAND_RAISE_STATE: ${isHandRaised ? "ACTIVE" : "STANDBY"}`}
          </div>
        </div>

        {status === "STANDBY" && (
          <div className="flex flex-col items-center justify-center py-12 text-center max-w-xl mx-auto space-y-6">
            <Camera className="w-12 h-12 text-[#05998c] opacity-75" />
            <div className="space-y-2">
              <h4 className="text-sm font-bold uppercase tracking-widest text-[#1C1C2E] dark:text-[#F0EDE6]">INITIATE NEURAL SCREENING</h4>
              <p className="text-xs text-[#1C1C2E]/60 dark:text-[#F0EDE6]/50 uppercase tracking-wider leading-relaxed">
                Uses computer vision to scan your silhouette and output a dynamic typographic glitch layout. Camera processing runs 100% locally and privately in your browser.
              </p>
            </div>
            <button
              onClick={handleStart}
              className="border border-[#05998c] text-[#05998c] hover:bg-[#05998c] hover:text-black transition-all px-6 py-3 font-mono-rdv text-xs uppercase tracking-widest"
            >
              [ INITIATE NEURAL SCANNER ]
            </button>
          </div>
        )}

        {status === "LOADING" && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <RefreshCw className="w-8 h-8 text-[#05998c] animate-spin" />
            <div className="text-xs uppercase tracking-widest text-[#1C1C2E]/70 dark:text-[#F0EDE6]/60">
              Initializing MediaPipe AI models & webcam feed...
            </div>
          </div>
        )}

        {status === "ACTIVE" && (
          <div className="relative w-full aspect-video md:aspect-[21/9] border border-white/10 bg-black overflow-hidden group">
            {/* Live Camera canvas */}
            <canvas ref={canvasRef} className="w-full h-full object-cover block" />

            {/* Overlaid HUD details */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-gradient-to-t from-black/40 via-transparent to-black/20 font-mono-rdv text-[10px]">
              <div className="flex justify-between text-white/50">
                <div>SYS.FEED_01 // OK</div>
                <div>POSE_DETECTOR: 30FPS</div>
              </div>
              <div className="self-center">
                <div className={`px-4 py-2 border rounded-full text-xs uppercase font-bold tracking-widest backdrop-blur-md transition-all duration-300 ${
                  isHandRaised 
                    ? "bg-[#05998c]/20 border-[#05998c] text-[#05998c] animate-pulse" 
                    : "bg-black/60 border-[#00ffcc] text-[#00ffcc]"
                }`}>
                  {isHandRaised ? "NEURAL_EFFECT: ACTIVE" : "RAISE YOUR HAND TO ENGAGE"}
                </div>
              </div>
              <div className="flex justify-between text-white/40">
                <div>RESOLUTION: 1280x720</div>
                <div>RENDER: CANVAS2D_COMPOSITE</div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
              <button
                onClick={handleCapture}
                className="bg-black/80 hover:bg-[#00ffcc] hover:text-black border border-white/20 text-white transition-all px-3 py-1.5 font-mono-rdv text-[9px] uppercase tracking-wider flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                [ CAPTURE ]
              </button>
              <button
                onClick={handleStop}
                className="bg-black/80 hover:bg-[#05998c] hover:text-black border border-white/20 text-white transition-all px-3 py-1.5 font-mono-rdv text-[9px] uppercase tracking-wider"
              >
                [ SHUTDOWN ]
              </button>
            </div>
          </div>
        )}

        {status === "ERROR" && (
          <div className="flex flex-col items-center justify-center py-12 text-center max-w-xl mx-auto space-y-6">
            <AlertTriangle className="w-12 h-12 text-[#05998c]" />
            <div className="space-y-2">
              <h4 className="text-sm font-bold uppercase tracking-widest text-[#05998c]">HARDWARE / COMPILING ERROR</h4>
              <p className="text-xs text-white/40 uppercase tracking-widest leading-relaxed">
                {errorMsg}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleStart}
                className="border border-white/20 text-white hover:border-white hover:bg-white/5 transition-all px-4 py-2.5 font-mono-rdv text-xs uppercase tracking-widest"
              >
                RETRY
              </button>
              <button
                onClick={() => setStatus("STANDBY")}
                className="border border-[#05998c] text-[#05998c] hover:bg-[#05998c] hover:text-black transition-all px-4 py-2.5 font-mono-rdv text-xs uppercase tracking-widest"
              >
                RETURN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
