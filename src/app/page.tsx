'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';

const BOOT_LINES = [
  { text: 'DESCEND v0.1.0', delay: 200, dim: false, danger: false },
  { text: 'INITIALIZING NEURAL INTERFACE...', delay: 1000, dim: true, danger: false },
  { text: '> LOADING SIMULATION ENVIRONMENT... [OK]', delay: 1800, dim: true, danger: false },
  { text: '> VERIFYING SUBJECT IDENTITY... [OK]', delay: 2600, dim: true, danger: false },
  { text: '> CALIBRATING DECISION ENGINE... [OK]', delay: 3400, dim: true, danger: false },
  { text: '> WARNING: REALITY ANCHOR UNSTABLE', delay: 4400, dim: false, danger: true },
];

const ENTER_DELAY = 5600;

export default function StartScreen() {
  const router = useRouter();
  const { startGame } = useGameStore();
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [showEnter, setShowEnter] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      const t = setTimeout(() => {
        setVisibleLines((prev) => [...prev, i]);
      }, line.delay);
      timers.push(t);
    });

    const enterTimer = setTimeout(() => setShowEnter(true), ENTER_DELAY);
    timers.push(enterTimer);

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleEnter = useCallback(() => {
    if (entering) return;
    setEntering(true);
    startGame();
    setTimeout(() => router.push('/game'), 600);
  }, [entering, startGame, router]);

  useEffect(() => {
    if (!showEnter) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') handleEnter();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showEnter, handleEnter]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      }}
    >
      <div style={{ width: '100%', maxWidth: '600px' }}>
        {BOOT_LINES.map((line, i) => (
          <div
            key={i}
            style={{
              opacity: visibleLines.includes(i) ? 1 : 0,
              transform: visibleLines.includes(i) ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              marginBottom: '8px',
              fontSize: i === 0 ? '1.2rem' : '0.8rem',
              fontWeight: i === 0 ? '700' : '400',
              color: line.danger ? '#ff0040' : line.dim ? '#008f11' : '#00ff41',
              letterSpacing: i === 0 ? '0.2em' : '0.05em',
              animation:
                line.danger && visibleLines.includes(i)
                  ? 'glow-pulse 1.5s ease-in-out infinite'
                  : undefined,
            }}
          >
            {line.text}
          </div>
        ))}

        <div
          style={{
            borderTop: '1px solid #1a2a1a',
            marginTop: '32px',
            marginBottom: '32px',
            opacity: showEnter ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />

        <div
          style={{
            opacity: showEnter ? 1 : 0,
            transform: showEnter ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <button
            onClick={handleEnter}
            disabled={entering}
            style={{
              background: 'none',
              border: '1px solid #00ff41',
              color: entering ? '#008f11' : '#00ff41',
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              padding: '12px 32px',
              cursor: entering ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              animation: entering ? 'none' : 'glow-pulse 2.5s ease-in-out infinite',
            }}
            onMouseEnter={(e) => {
              if (!entering) {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = 'rgba(0,255,65,0.08)';
                btn.style.boxShadow = '0 0 20px rgba(0,255,65,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = 'none';
              btn.style.boxShadow = 'none';
            }}
          >
            {entering ? '> LOADING...' : '> ENTER THE MATRIX'}
          </button>
          <p
            style={{
              color: '#003300',
              fontSize: '0.6rem',
              marginTop: '12px',
              letterSpacing: '0.08em',
            }}
          >
            press ENTER or SPACE to begin
          </p>
        </div>

        <div
          style={{
            marginTop: '80px',
            opacity: showEnter ? 0.2 : 0,
            transition: 'opacity 1s ease 0.5s',
            fontSize: '0.6rem',
            color: '#003300',
            letterSpacing: '0.1em',
          }}
        >
          THIS IS NOT A GAME ABOUT WINNING.
        </div>
      </div>
    </main>
  );
}
