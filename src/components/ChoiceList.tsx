'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Choice } from '@/types/game';

interface ChoiceListProps {
  choices: Choice[];
  onChoice: (choice: Choice) => void;
  disabled?: boolean;
}

export default function ChoiceList({ choices, onChoice, disabled = false }: ChoiceListProps) {
  useEffect(() => {
    if (disabled) return;

    const handleKey = (e: KeyboardEvent) => {
      const index = parseInt(e.key) - 1;
      if (index >= 0 && index < choices.length) {
        onChoice(choices[index]);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [choices, onChoice, disabled]);

  if (choices.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="mt-8 space-y-2">
        {choices.map((choice, index) => (
          <motion.button
            key={choice.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: disabled ? 0.3 : 1, x: 0 }}
            transition={{ delay: index * 0.12, duration: 0.25 }}
            disabled={disabled}
            onClick={() => !disabled && onChoice(choice)}
            className="choice-btn group block w-full text-left"
            style={{
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            <span
              className="choice-prompt"
              style={{ color: '#008f11', marginRight: '8px', transition: 'color 0.15s' }}
            >
              {`[${index + 1}]`}
            </span>
            <span
              className="choice-label"
              style={{
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                fontSize: '0.85rem',
                color: disabled ? '#004d09' : '#00cc33',
                transition: 'color 0.15s, text-shadow 0.15s',
              }}
            >
              {choice.label}
            </span>
          </motion.button>
        ))}
        {!disabled && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: choices.length * 0.12 + 0.3 }}
            style={{
              fontSize: '0.65rem',
              color: '#004d09',
              marginTop: '12px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            press 1–{choices.length} or click to choose
          </motion.p>
        )}
      </div>
    </AnimatePresence>
  );
}
