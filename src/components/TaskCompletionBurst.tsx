import { memo, useEffect, useState, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
  type: 'circle' | 'star' | 'ring';
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6'];

const createParticles = (): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < 12; i++) {
    particles.push({
      id: i,
      x: 0,
      y: 0,
      color: COLORS[i % COLORS.length],
      size: 3 + Math.random() * 4,
      angle: (i / 12) * 360 + (Math.random() - 0.5) * 30,
      speed: 20 + Math.random() * 25,
      type: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'ring' : 'circle',
    });
  }
  return particles;
};

/**
 * Lightweight particle burst animation rendered with CSS transforms.
 * No canvas, no heavy libraries — just 12 divs that animate and unmount.
 */
export const TaskCompletionBurst = memo(({ onDone }: { onDone: () => void }) => {
  const [particles] = useState(createParticles);

  useEffect(() => {
    const timer = setTimeout(onDone, 600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-50">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.speed;
        const ty = Math.sin(rad) * p.speed;
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              borderRadius: p.type === 'ring' ? '50%' : p.type === 'star' ? '2px' : '50%',
              backgroundColor: p.type === 'ring' ? 'transparent' : p.color,
              border: p.type === 'ring' ? `2px solid ${p.color}` : 'none',
              transform: `translate(0, 0) scale(1)`,
              animation: `burst-particle 500ms ease-out forwards`,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
            } as React.CSSProperties}
          />
        );
      })}
      <style>{`
        @keyframes burst-particle {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
});

TaskCompletionBurst.displayName = 'TaskCompletionBurst';
