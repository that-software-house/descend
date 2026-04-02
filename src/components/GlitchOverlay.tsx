'use client';

import { useEffect, useState } from 'react';
import { GlitchIntensity } from '@/types/game';

interface GlitchOverlayProps {
  intensity: GlitchIntensity;
  active: boolean;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function GlitchOverlay({ intensity, active }: GlitchOverlayProps) {
  const [slices, setSlices] = useState<{ top: number; height: number; offset: number }[]>([]);

  useEffect(() => {
    if (!active || intensity === 'none') {
      setSlices([]);
      return;
    }

    const count = intensity === 'subtle' ? 2 : intensity === 'intense' ? 5 : 10;

    const generate = () => {
      const newSlices = Array.from({ length: count }, () => ({
        top: randomBetween(0, 100),
        height: randomBetween(1, intensity === 'extreme' ? 8 : 3),
        offset: randomBetween(-6, 6) * (intensity === 'extreme' ? 3 : 1),
      }));
      setSlices(newSlices);
    };

    generate();
    const interval = setInterval(generate, intensity === 'subtle' ? 200 : 80);
    return () => clearInterval(interval);
  }, [active, intensity]);

  if (!active || intensity === 'none') return null;

  const opacityMap: Record<GlitchIntensity, number> = {
    none: 0,
    subtle: 0.15,
    intense: 0.35,
    extreme: 0.6,
  };

  const opacity = opacityMap[intensity];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* RGB channel split layer */}
      {(intensity === 'intense' || intensity === 'extreme') && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: 'transparent',
              mixBlendMode: 'screen',
              animation: 'rgb-split 0.15s steps(1) infinite',
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundColor: '#ff0040',
              transform: `translateX(${intensity === 'extreme' ? 4 : 2}px)`,
              mixBlendMode: 'screen',
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundColor: '#00ffff',
              transform: `translateX(${intensity === 'extreme' ? -4 : -2}px)`,
              mixBlendMode: 'screen',
            }}
          />
        </>
      )}

      {/* Horizontal slice tears */}
      {slices.map((slice, i) => (
        <div
          key={i}
          className="absolute left-0 right-0"
          style={{
            top: `${slice.top}%`,
            height: `${slice.height}%`,
            transform: `translateX(${slice.offset}px)`,
            backgroundColor: 'rgba(0, 255, 65, 0.04)',
            opacity,
          }}
        />
      ))}

      {/* Full screen flicker for extreme */}
      {intensity === 'extreme' && (
        <div
          className="absolute inset-0"
          style={{
            animation: 'flicker-intense 0.3s steps(1) infinite',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
      )}
    </div>
  );
}
