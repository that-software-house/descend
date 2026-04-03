export type EndingType = 'escape' | 'captured' | 'limbo';
export type GlitchIntensity = 'none' | 'subtle' | 'intense' | 'extreme';
export type InputType = 'choices' | 'text' | 'mixed';

export interface Effects {
  time?: number;
  danger?: number;
  belief?: number;
  flags?: Record<string, boolean | number>;
}

export interface Choice {
  id: string;
  label: string;
  next: string;
  condition?: string;
  effect?: Effects;
  hidden?: boolean;
}

export interface GameNode {
  id: string;
  text: string | string[];
  choices: Choice[];
  effects?: Effects;
  glitch?: GlitchIntensity;
  meta?: boolean;
  ending?: EndingType;
  ambientOverride?: string;
  inputType?: InputType;
  textPrompt?: string;
}

export interface GameState {
  timeElapsed: number;
  dangerLevel: number;
  belief: number;
  location: string;
  flags: Record<string, boolean | number>;
  loopCount: number;
}

export interface GameStore {
  currentNodeId: string;
  gameState: GameState;
  history: string[];
  isGlitching: boolean;
  glitchIntensity: GlitchIntensity;
  isTyping: boolean;
  isStarted: boolean;
  ending: EndingType | null;
  startGame: () => void;
  makeChoice: (choice: Choice) => void;
  setTyping: (typing: boolean) => void;
  setGlitching: (glitching: boolean, intensity?: GlitchIntensity) => void;
  resetGame: () => void;
}
