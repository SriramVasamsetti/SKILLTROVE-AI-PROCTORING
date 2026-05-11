import { useEffect, useMemo, useState } from 'react';

export function useParallax(intensity = 0.015) {
  const [mouse, setMouse] = useState({ x: 0, y: 0, width: 1, height: 1 });

  useEffect(() => {
    function onMove(e) {
      setMouse({
        x: e.clientX,
        y: e.clientY,
        width: window.innerWidth || 1,
        height: window.innerHeight || 1,
      });
    }
    function onResize() {
      setMouse((prev) => ({
        ...prev,
        width: window.innerWidth || 1,
        height: window.innerHeight || 1,
      }));
    }

    onResize();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const normalized = useMemo(
    () => ({
      x: (mouse.x / mouse.width - 0.5) * 2,
      y: (mouse.y / mouse.height - 0.5) * 2,
    }),
    [mouse],
  );

  const offset = useMemo(
    () => ({
      x: normalized.x * mouse.width * intensity,
      y: normalized.y * mouse.height * intensity,
    }),
    [intensity, mouse.height, mouse.width, normalized.x, normalized.y],
  );

  return { mouse, normalized, offset };
}
