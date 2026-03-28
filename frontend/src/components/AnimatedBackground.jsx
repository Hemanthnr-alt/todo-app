import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const AnimatedBackground = () => {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    // Two particle types: pink + purple
    const particles = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      particles.length = 0;
      for (let i = 0; i < 60; i++) {
        const isPurple = Math.random() > 0.5;
        particles.push({
          x:       Math.random() * canvas.width,
          y:       Math.random() * canvas.height,
          r:       Math.random() * 1.6 + 0.3,
          alpha:   Math.random() * 0.25 + 0.04,
          vx:      (Math.random() - 0.5) * 0.2,
          vy:      (Math.random() - 0.5) * 0.2,
          // Alternate between pink #ff6b9d and purple #c084fc
          color:   isPurple ? [192, 132, 252] : [255, 107, 157],
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.alpha})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      animId = requestAnimationFrame(draw);
    };

    const onResize = () => { resize(); init(); };
    resize();
    init();
    draw();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 0,
        opacity: isDark ? 0.38 : 0.14,
      }}
    />
  );
};

export default AnimatedBackground;
