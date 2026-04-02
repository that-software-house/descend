'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';

let audioCtx: AudioContext | null = null;
let droneGain: GainNode | null = null;
let noiseGain: GainNode | null = null;
let isRunning = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function createDrone(ctx: AudioContext, masterGain: GainNode) {
  const frequencies = [60, 90, 120, 180];

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.015 / (i + 1), ctx.currentTime);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
  });
}

function createNoise(ctx: AudioContext, masterGain: GainNode) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, ctx.currentTime);

  source.connect(filter);
  filter.connect(masterGain);
  source.start();
}

export function useAmbientAudio() {
  const masterGainRef = useRef<GainNode | null>(null);

  const start = useCallback(() => {
    if (isRunning) return;

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 3);
    master.connect(ctx.destination);
    masterGainRef.current = master;
    droneGain = master;

    const noiseNode = ctx.createGain();
    noiseNode.gain.setValueAtTime(0.02, ctx.currentTime);
    noiseNode.connect(ctx.destination);
    noiseGain = noiseNode;

    createDrone(ctx, master);
    createNoise(ctx, noiseNode);
    isRunning = true;
  }, []);

  const stop = useCallback(() => {
    if (!audioCtx || !masterGainRef.current) return;
    const ctx = audioCtx;
    const gain = masterGainRef.current;
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => {
      isRunning = false;
    }, 1600);
  }, []);

  const updateIntensity = useCallback((dangerLevel: number) => {
    if (!droneGain || !audioCtx) return;
    const ctx = audioCtx;
    const baseVolume = 0.08;
    const boost = Math.min(dangerLevel * 0.015, 0.08);
    droneGain.gain.linearRampToValueAtTime(baseVolume + boost, ctx.currentTime + 0.5);
  }, []);

  return { start, stop, updateIntensity };
}

export default function AmbientAudio() {
  const { isStarted, ending, gameState } = useGameStore();
  const { start, stop, updateIntensity } = useAmbientAudio();
  const startedRef = useRef(false);

  useEffect(() => {
    if (isStarted && !startedRef.current) {
      startedRef.current = true;
      start();
    }
  }, [isStarted, start]);

  useEffect(() => {
    if (ending) {
      stop();
    }
  }, [ending, stop]);

  useEffect(() => {
    updateIntensity(gameState.dangerLevel);
  }, [gameState.dangerLevel, updateIntensity]);

  return null;
}
