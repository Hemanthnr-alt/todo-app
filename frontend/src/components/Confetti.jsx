// frontend/src/components/Confetti.jsx
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

const Confetti = ({ active, onComplete }) => {
  useEffect(() => {
    if (active) {
      const duration = 2000;
      const end = Date.now() + duration;
      
      const colors = ['#ff6b9d', '#ff99cc', '#ffb6c1', '#ffd1e0'];
      
      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        } else {
          if (onComplete) onComplete();
        }
      }());
    }
  }, [active, onComplete]);
  
  return null;
};

export default Confetti;