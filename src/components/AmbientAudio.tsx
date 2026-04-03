'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

let audioCtx: AudioContext | null = null;
let masterNode: GainNode | null = null;
let isRunning = false;
let isMuted = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/**
 * Call inside a user gesture before navigation to unlock the AudioContext.
 */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

function buildDrone(ctx: AudioContext, dest: AudioNode) {
  // Audible frequencies: low hum + mid harmonics + high shimmer
  const layers: { freq: number; type: OscillatorType; gain: number }[] = [
    { freq: 220,  type: 'sine',     gain: 0.18 }, // A3 — primary hum
    { freq: 330,  type: 'sine',     gain: 0.10 }, // E4 — fifth above
    { freq: 440,  type: 'triangle', gain: 0.06 }, // A4 — octave
    { freq: 110,  type: 'sine',     gain: 0.12 }, // A2 — low anchor
    { freq: 660,  type: 'triangle', gain: 0.04 }, // E5 — shimmer
  ];

  layers.forEach(({ freq, type, gain: gainVal }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Slight detune per layer for a beating/living quality
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.detune.setValueAtTime((Math.random() - 0.5) * 6, ctx.currentTime);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
  });
}

function buildNoise(ctx: AudioContext, dest: AudioNode) {
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Pink-ish noise via simple IIR approximation
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    data[i] = (b0 + b1 + b2 + white * 0.0556) * 0.11;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Bandpass: keep the hiss in the 800–3000Hz range (audible on laptops)
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, ctx.currentTime);
  filter.Q.setValueAtTime(0.5, ctx.currentTime);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);

  source.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(dest);
  source.start();
}

export function useAmbientAudio() {
  const masterGainRef = useRef<GainNode | null>(null);

  const start = useCallback(() => {
    if (isRunning) return;

    const ctx = getAudioContext();
    const resume = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();

    resume.then(() => {
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(isMuted ? 0 : 0.35, ctx.currentTime + 3);
      master.connect(ctx.destination);
      masterGainRef.current = master;
      masterNode = master;

      buildDrone(ctx, master);
      buildNoise(ctx, master);
      isRunning = true;
    }).catch(() => {});
  }, []);

  const stop = useCallback(() => {
    if (!audioCtx || !masterGainRef.current) return;
    const gain = masterGainRef.current;
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
    setTimeout(() => { isRunning = false; }, 1600);
  }, []);

  const updateIntensity = useCallback((dangerLevel: number) => {
    if (!masterNode || !audioCtx || isMuted) return;
    const base = 0.35;
    const boost = Math.min(dangerLevel * 0.04, 0.25);
    masterNode.gain.linearRampToValueAtTime(base + boost, audioCtx.currentTime + 0.8);
  }, []);

  const toggleMute = useCallback(() => {
    isMuted = !isMuted;
    if (masterNode && audioCtx) {
      masterNode.gain.linearRampToValueAtTime(
        isMuted ? 0 : 0.35,
        audioCtx.currentTime + 0.3
      );
    }
    return isMuted;
  }, []);

  return { start, stop, updateIntensity, toggleMute };
}

export default function AmbientAudio() {
  const { isStarted, ending, gameState } = useGameStore();
  const { start, stop, updateIntensity, toggleMute } = useAmbientAudio();
  const startedRef = useRef(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (isStarted && !startedRef.current) {
      startedRef.current = true;
      start();
    }
  }, [isStarted, start]);

  useEffect(() => {
    if (ending) stop();
  }, [ending, stop]);

  useEffect(() => {
    updateIntensity(gameState.dangerLevel);
  }, [gameState.dangerLevel, updateIntensity]);

  const handleMute = () => {
    const nowMuted = toggleMute();
    setMuted(nowMuted);
  };

  return (
    <button
      onClick={handleMute}
      title={muted ? 'Unmute audio' : 'Mute audio'}
      style={{
        position: 'fixed',
        bottom: '12px',
        right: '16px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: muted ? '#002200' : '#004d09',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.6rem',
        letterSpacing: '0.08em',
        padding: '4px 8px',
        opacity: 0.6,
        transition: 'opacity 0.2s, color 0.2s',
        zIndex: 50,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.6'; }}
    >
      {muted ? '[AUDIO: OFF]' : '[AUDIO: ON]'}
    </button>
  );
}
