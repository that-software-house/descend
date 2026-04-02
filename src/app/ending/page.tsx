'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { EndingType } from '@/types/game';

// ── Matrix code rain ─────────────────────────────────────
const MATRIX_CHARS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const fontSize = 14;
    const cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * fontSize;
        if (y < 0) { drops[i]++; continue; }

        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];

        // Leading character is bright, trail fades
        ctx.fillStyle = y < fontSize * 2 ? '#ccffdd' : '#00ff41';
        ctx.globalAlpha = Math.max(0.08, 1 - (drops[i] * fontSize) / canvas.height);
        ctx.fillText(char, i * fontSize, y);
        ctx.globalAlpha = 1;

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i]++;
        }
      }
    };

    const interval = setInterval(draw, 45);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.6 }}
    />
  );
}

// ── Ending content configs ────────────────────────────────
interface EndingConfig {
  title: string;
  lines: string[];
  quote: string;
  btnLabel: string;
  titleColor: string;
  dimColor: string;
  showRain: boolean;
}

const ENDINGS: Record<EndingType, EndingConfig> = {
  escape: {
    title: 'THE MATRIX HAS BEEN BREACHED.',
    lines: [
      '> SUBJECT: THOMAS A. ANDERSON',
      '> DESIGNATION: THE ONE',
      '> STATUS: AWAKE',
    ],
    quote:
      '"I\'m going to show them a world without rules.\nA world where anything is possible."',
    btnLabel: '> PLAY AGAIN',
    titleColor: '#00ff41',
    dimColor: '#008f11',
    showRain: true,
  },
  captured: {
    title: 'SYSTEM SECURE.',
    lines: [
      '> THREAT NEUTRALIZED',
      '> SUBJECT: MR. ANDERSON',
      '> DESIGNATION: ANOMALY — CONTAINED',
      '> STATUS: PROCESSED',
    ],
    quote:
      '"Every program that has been created since I arrived...\n...was designed to hold you prisoner."',
    btnLabel: '> TRY AGAIN',
    titleColor: '#ff0040',
    dimColor: '#7a001f',
    showRain: false,
  },
  limbo: {
    title: 'CONNECTION LOST.',
    lines: [
      '> SUBJECT: UNKNOWN',
      '> DESIGNATION: UNCLASSIFIED',
      '> LOOP COUNT: [CORRUPTED]',
      '> STATUS: INDETERMINATE',
    ],
    quote: '"You knew.\nYou always knew.\nBut knowing isn\'t the same as believing."',
    btnLabel: '> BEGIN AGAIN — IF YOU CAN',
    titleColor: '#336633',
    dimColor: '#1a331a',
    showRain: false,
  },
};

// ── Inner component (uses useSearchParams) ────────────────
function EndingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetGame } = useGameStore();
  const [visible, setVisible] = useState(false);

  const rawType = searchParams.get('type') as EndingType | null;
  const endingType: EndingType =
    rawType && rawType in ENDINGS ? rawType : 'captured';

  const config = ENDINGS[endingType];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  const handleReplay = () => {
    resetGame();
    router.push('/');
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        zIndex: 1,
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      }}
    >
      {config.showRain && <MatrixRain />}

      {/* Dark overlay for readability over rain */}
      {config.showRain && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5,5,5,0.55)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '600px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        {/* Title */}
        <h1
          style={{
            color: config.titleColor,
            fontSize: '1.1rem',
            fontWeight: '700',
            letterSpacing: '0.15em',
            marginBottom: '28px',
            animation:
              endingType === 'escape'
                ? 'glow-pulse 2s ease-in-out infinite'
                : endingType === 'captured'
                ? 'rgb-split 0.8s steps(1) infinite'
                : undefined,
          }}
        >
          {config.title}
        </h1>

        {/* Status lines */}
        <div style={{ marginBottom: '32px' }}>
          {config.lines.map((line, i) => (
            <p
              key={i}
              style={{
                color: config.dimColor,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                marginBottom: '4px',
                opacity: visible ? 1 : 0,
                transition: `opacity 0.4s ease ${0.2 + i * 0.15}s`,
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop: `1px solid ${endingType === 'limbo' ? '#1a331a' : '#1a2a1a'}`,
            marginBottom: '28px',
          }}
        />

        {/* Quote */}
        <blockquote
          style={{
            color:
              endingType === 'limbo'
                ? '#336633'
                : endingType === 'captured'
                ? '#cc0033'
                : '#00cc33',
            fontSize: '0.82rem',
            lineHeight: '1.9',
            marginBottom: '40px',
            whiteSpace: 'pre-line',
            fontStyle: 'italic',
            opacity: 0.9,
          }}
        >
          {config.quote}
        </blockquote>

        {/* CTA */}
        <button
          onClick={handleReplay}
          style={{
            background: 'none',
            border: `1px solid ${config.titleColor}`,
            color: config.titleColor,
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: endingType === 'limbo' ? '0.72rem' : '0.82rem',
            letterSpacing: '0.12em',
            padding: '10px 24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            opacity: endingType === 'limbo' ? 0.45 : 1,
            animation:
              endingType === 'escape'
                ? 'glow-pulse 2s ease-in-out infinite'
                : undefined,
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = `${config.titleColor}18`;
            btn.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = 'none';
            btn.style.opacity = endingType === 'limbo' ? '0.45' : '1';
          }}
        >
          {config.btnLabel}
        </button>

        {/* Ending type footnote */}
        <p
          style={{
            marginTop: '60px',
            color: '#002200',
            fontSize: '0.6rem',
            letterSpacing: '0.1em',
          }}
        >
          ENDING: {endingType.toUpperCase()}
        </p>
      </div>
    </main>
  );
}

// ── Page export (Suspense boundary for useSearchParams) ───
export default function EndingPage() {
  return (
    <Suspense fallback={null}>
      <EndingContent />
    </Suspense>
  );
}
