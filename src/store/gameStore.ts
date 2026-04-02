'use client';

import { create } from 'zustand';
import { GameStore, GameState, Choice, GlitchIntensity, EndingType } from '@/types/game';
import { applyEffects } from '@/engine/narrativeEngine';
import { getNodesSync } from '@/lib/nodeRepository';

const INITIAL_GAME_STATE: GameState = {
  timeElapsed: 0,
  dangerLevel: 0,
  belief: 1,
  location: 'apartment',
  flags: {},
  loopCount: 0,
};

const GLITCH_DURATION_MS = 2000;

export const useGameStore = create<GameStore>((set, get) => ({
  currentNodeId: 'init',
  gameState: INITIAL_GAME_STATE,
  history: [],
  isGlitching: false,
  glitchIntensity: 'none',
  isTyping: false,
  isStarted: false,
  ending: null,

  startGame: () => {
    set({
      currentNodeId: 'init',
      gameState: INITIAL_GAME_STATE,
      history: [],
      isGlitching: false,
      glitchIntensity: 'none',
      isTyping: false,
      isStarted: true,
      ending: null,
    });
  },

  makeChoice: (choice: Choice) => {
    const { currentNodeId, gameState, history } = get();

    const stateAfterChoice = applyEffects(gameState, choice.effect);

    const nodes = getNodesSync();
    const nextNode = nodes.find((n) => n.id === choice.next);
    if (!nextNode) return;

    const stateAfterNode = applyEffects(stateAfterChoice, nextNode.effects);

    const newLoopCount =
      typeof nextNode.effects?.flags?.['loopCount'] === 'number'
        ? Math.max(stateAfterNode.loopCount, nextNode.effects.flags['loopCount'] as number)
        : stateAfterNode.loopCount;

    const finalState: GameState = { ...stateAfterNode, loopCount: newLoopCount };

    const ending: EndingType | null = nextNode.ending ?? null;
    const glitchIntensity: GlitchIntensity = nextNode.glitch ?? 'none';
    const shouldGlitch = glitchIntensity !== 'none';

    set({
      currentNodeId: nextNode.id,
      gameState: finalState,
      history: [...history, currentNodeId],
      ending,
      glitchIntensity,
      isGlitching: shouldGlitch,
    });

    if (shouldGlitch) {
      setTimeout(() => {
        set({ isGlitching: false });
      }, GLITCH_DURATION_MS);
    }
  },

  setTyping: (typing: boolean) => {
    set({ isTyping: typing });
  },

  setGlitching: (glitching: boolean, intensity: GlitchIntensity = 'subtle') => {
    set({ isGlitching: glitching, glitchIntensity: glitching ? intensity : 'none' });

    if (glitching) {
      setTimeout(() => {
        set({ isGlitching: false });
      }, GLITCH_DURATION_MS);
    }
  },

  resetGame: () => {
    set({
      currentNodeId: 'init',
      gameState: INITIAL_GAME_STATE,
      history: [],
      isGlitching: false,
      glitchIntensity: 'none',
      isTyping: false,
      isStarted: false,
      ending: null,
    });
  },
}));
