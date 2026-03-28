import { useEffect } from 'react';
import confetti from 'canvas-confetti';

const Confetti = ({ active, onComplete }) => {
  useEffect(() => {
    if (!active) return;
    const end = Date.now() + 2000;
    const colors = ['#ff6b9d', '#ff99cc', '#ffb6c1', '#ffd1e0'];
    (function frame() {
      confetti({ particleCount: 3, angle: 60,  spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
      else onComplete?.();
    }());
  }, [active, onComplete]);
  return null;
};

export default Confetti;
