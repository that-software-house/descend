import { GameState } from '@/types/game';

type Operator = '>=' | '<=' | '>' | '<' | '===' | '==' | '!==';

const OPERATORS: Record<Operator, (a: number, b: number) => boolean> = {
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '>':  (a, b) => a > b,
  '<':  (a, b) => a < b,
  '===': (a, b) => a === b,
  '==':  (a, b) => a === b,
  '!==': (a, b) => a !== b,
};

const OPERATOR_PATTERN = /(>=|<=|===|!==|==|>|<)/;

function resolveStateValue(key: string, state: GameState): number {
  if (key === 'belief') return state.belief;
  if (key === 'danger') return state.dangerLevel;
  if (key === 'time') return state.timeElapsed;
  if (key === 'loopCount') return state.loopCount;

  if (key.startsWith('flags.')) {
    const flagKey = key.slice(6);
    const value = state.flags[flagKey];
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'number') return value;
    return 0;
  }

  return 0;
}

export function evaluateCondition(condition: string, state: GameState): boolean {
  const trimmed = condition.trim();
  const match = trimmed.match(OPERATOR_PATTERN);

  if (!match || match.index === undefined) return true;

  const operator = match[0] as Operator;
  const parts = trimmed.split(OPERATOR_PATTERN);

  if (parts.length < 3) return true;

  const left = parts[0].trim();
  const right = parts[2].trim();

  const leftValue = resolveStateValue(left, state);
  const rightValue = parseFloat(right);

  if (isNaN(rightValue)) return true;

  const fn = OPERATORS[operator];
  return fn ? fn(leftValue, rightValue) : true;
}
