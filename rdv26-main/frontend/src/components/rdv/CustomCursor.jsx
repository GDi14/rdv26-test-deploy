import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let mx = 0, my = 0, rx = 0, ry = 0;

    const move = (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    };

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };

    const onEnter = (e) => {
      if (e.target.closest("a, button, [data-cursor='hover'], input, textarea, select"))
        ring.classList.add("hover");
    };
    const onLeave = (e) => {
      if (e.target.closest("a, button, [data-cursor='hover'], input, textarea, select"))
        ring.classList.remove("hover");
    };

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", onEnter);
    document.addEventListener("mouseout", onLeave);
    const id = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", onEnter);
      document.removeEventListener("mouseout", onLeave);
      cancelAnimationFrame(id);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="rdv-cursor" data-testid="rdv-cursor-ring" />
      <div ref={dotRef} className="rdv-cursor-dot" data-testid="rdv-cursor-dot" />
    </>
  );
}
