import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const paletteForTheme = (isDark) => (
  isDark
    ? [
        [255, 122, 89],
        [109, 211, 255],
        [117, 107, 255],
      ]
    : [
        [255, 160, 122],
        [83, 187, 237],
        [255, 209, 102],
      ]
);

const AnimatedBackground = () => {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const colors = paletteForTheme(isDark);
    let animId;
    const particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      particles.length = 0;
      for (let index = 0; index < 48; index += 1) {
        const color = colors[index % colors.length];
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 2.8 + 0.8,
          alpha: Math.random() * (isDark ? 0.22 : 0.18) + 0.05,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          color,
        });
      }
    };

    const drawGlow = () => {
      const gradientA = ctx.createRadialGradient(
        canvas.width * 0.22,
        canvas.height * 0.18,
        0,
        canvas.width * 0.22,
        canvas.height * 0.18,
        canvas.width * 0.32,
      );
      gradientA.addColorStop(0, isDark ? "rgba(109,211,255,0.12)" : "rgba(255,122,89,0.12)");
      gradientA.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradientA;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradientB = ctx.createRadialGradient(
        canvas.width * 0.82,
        canvas.height * 0.1,
        0,
        canvas.width * 0.82,
        canvas.height * 0.1,
        canvas.width * 0.22,
      );
      gradientB.addColorStop(0, isDark ? "rgba(255,122,89,0.12)" : "rgba(109,211,255,0.12)");
      gradientB.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradientB;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGlow();

      particles.forEach((particle) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${particle.alpha})`;
        ctx.shadowBlur = 18;
        ctx.shadowColor = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, 0.15)`;
        ctx.fill();

        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -10) particle.x = canvas.width + 10;
        if (particle.x > canvas.width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = canvas.height + 10;
        if (particle.y > canvas.height + 10) particle.y = -10;
      });

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(draw);
    };

    const onResize = () => {
      resize();
      init();
    };

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
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: isDark ? 0.8 : 0.72,
      }}
    />
  );
};

export default AnimatedBackground;
