'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface TypewriterTextProps {
  lines: string[];
  speed?: number;
  onComplete?: () => void;
  className?: string;
  skipable?: boolean;
}

export default function TypewriterText({
  lines,
  speed = 28,
  onComplete,
  className = '',
  skipable = true,
}: TypewriterTextProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const skipToEnd = useCallback(() => {
    if (isDone) return;
    setDisplayedLines(lines);
    setCurrentLineIndex(lines.length);
    setCurrentCharIndex(0);
    setIsDone(true);
    if (!completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current?.();
    }
  }, [isDone, lines]);

  // Reset when lines change
  useEffect(() => {
    setDisplayedLines([]);
    setCurrentLineIndex(0);
    setCurrentCharIndex(0);
    setIsDone(false);
    completedRef.current = false;
  }, [lines]);

  // Typing animation
  useEffect(() => {
    if (isDone) return;
    if (currentLineIndex >= lines.length) {
      setIsDone(true);
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    const currentLine = lines[currentLineIndex];

    if (currentLine === '...' || currentLine === '') {
      const pause = setTimeout(() => {
        setDisplayedLines((prev) => [...prev, currentLine]);
        setCurrentLineIndex((prev) => prev + 1);
        setCurrentCharIndex(0);
      }, 600);
      return () => clearTimeout(pause);
    }

    if (currentCharIndex < currentLine.length) {
      const timeout = setTimeout(() => {
        setCurrentCharIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      const pause = setTimeout(() => {
        setDisplayedLines((prev) => [...prev, currentLine]);
        setCurrentLineIndex((prev) => prev + 1);
        setCurrentCharIndex(0);
      }, 120);
      return () => clearTimeout(pause);
    }
  }, [currentLineIndex, currentCharIndex, lines, speed, isDone]);

  // Cursor blink
  useEffect(() => {
    if (isDone) return;
    const interval = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(interval);
  }, [isDone]);

  const currentLine =
    currentLineIndex < lines.length ? lines[currentLineIndex] : '';
  const partialLine = currentLine.slice(0, currentCharIndex);

  return (
    <div
      className={`terminal-text ${className}`}
      onClick={skipable ? skipToEnd : undefined}
      style={{ cursor: skipable && !isDone ? 'pointer' : 'default' }}
    >
      {displayedLines.map((line, i) => (
        <p key={i} className="mb-1 leading-relaxed">
          {line === '...' ? (
            <span className="opacity-50">{line}</span>
          ) : (
            line
          )}
        </p>
      ))}
      {!isDone && currentLineIndex < lines.length && (
        <p className="mb-1 leading-relaxed">
          {partialLine}
          <span
            className="inline-block w-2 h-4 ml-px align-middle"
            style={{
              backgroundColor: '#00ff41',
              opacity: showCursor ? 1 : 0,
              transition: 'opacity 0.1s',
            }}
          />
        </p>
      )}
    </div>
  );
}
