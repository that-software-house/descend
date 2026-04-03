'use client';

import { useState, useRef, useEffect } from 'react';

interface FreeTextInputProps {
  prompt?: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export default function FreeTextInput({
  prompt = 'What do you do?',
  onSubmit,
  disabled = false,
  isProcessing = false,
}: FreeTextInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && !isProcessing) {
      inputRef.current?.focus();
    }
  }, [disabled, isProcessing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim() && !disabled && !isProcessing) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const terminalStyle: React.CSSProperties = {
    fontFamily: 'JetBrains Mono, monospace',
    color: '#00ff41',
    fontSize: '0.9rem',
    lineHeight: '1.6',
  };

  return (
    <div className="mt-8" style={terminalStyle}>
      <p style={{ color: '#004d09', fontSize: '0.7rem', marginBottom: '12px', letterSpacing: '0.08em' }}>
        {prompt.toUpperCase()}
      </p>

      {isProcessing ? (
        <div className="flex items-center gap-2">
          <span style={{ color: '#004d09' }}>&gt;</span>
          <span style={{ color: '#008f11', animation: 'blink 1s step-end infinite' }}>
            PROCESSING...
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span style={{ color: '#00ff41' }}>&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isProcessing}
            placeholder="type your response and press enter"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#00ff41',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.9rem',
              width: '100%',
              caretColor: '#00ff41',
            }}
            className="placeholder-opacity-20"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      )}

      <p style={{ color: '#002200', fontSize: '0.6rem', marginTop: '8px' }}>
        press enter to submit — or choose below
      </p>
    </div>
  );
}
