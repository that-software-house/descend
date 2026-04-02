import { GameNode, GameState, Choice, Effects } from '@/types/game';
import { evaluateCondition } from './conditionEvaluator';

export function resolveNode(id: string, nodes: GameNode[]): GameNode | null {
  return nodes.find((n) => n.id === id) ?? null;
}

export function applyEffects(state: GameState, effects?: Effects): GameState {
  if (!effects) return state;

  const updatedFlags = effects.flags
    ? { ...state.flags, ...effects.flags }
    : state.flags;

  const loopFlagValue = effects.flags?.['loopCount'];
  const newLoopCount =
    typeof loopFlagValue === 'number'
      ? Math.max(state.loopCount, loopFlagValue)
      : state.loopCount;

  return {
    ...state,
    timeElapsed: state.timeElapsed + (effects.time ?? 0),
    dangerLevel: Math.max(0, state.dangerLevel + (effects.danger ?? 0)),
    belief: state.belief + (effects.belief ?? 0),
    flags: updatedFlags,
    loopCount: newLoopCount,
  };
}

export function filterChoices(choices: Choice[], state: GameState): Choice[] {
  return choices.filter((choice) => {
    if (!choice.condition) return true;
    return evaluateCondition(choice.condition, state);
  });
}

export function isEndingNode(node: GameNode): boolean {
  return node.ending !== undefined;
}

export function getNodeText(node: GameNode): string[] {
  if (Array.isArray(node.text)) return node.text;
  return [node.text];
}
