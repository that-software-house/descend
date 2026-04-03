'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { filterChoices, resolveNode, getNodeText } from '@/engine/narrativeEngine';
import TypewriterText from './TypewriterText';
import ChoiceList from './ChoiceList';
import GlitchOverlay from './GlitchOverlay';
import AmbientAudio from './AmbientAudio';
import FreeTextInput from './FreeTextInput';
import { getNodes, getNodesSync } from '@/lib/nodeRepository';
import { GameNode } from '@/types/game';

export default function Terminal() {
  const router = useRouter();
  const {
    currentNodeId,
    gameState,
    isGlitching,
    glitchIntensity,
    isTyping,
    ending,
    makeChoice,
    setTyping,
  } = useGameStore();

  const [typingComplete, setTypingComplete] = useState(false);
  const [nodes, setNodes] = useState<GameNode[]>(getNodesSync());
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [atmosphericText, setAtmosphericText] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Hydrate from Supabase on mount (falls back to local JSON automatically)
  useEffect(() => {
    getNodes().then(setNodes);
  }, []);

  const currentNode = resolveNode(currentNodeId, nodes);
  const visibleChoices = currentNode
    ? filterChoices(currentNode.choices, gameState)
    : [];

  const inputType = currentNode?.inputType ?? 'choices';
  const showTextInput = typingComplete && !isTyping && (inputType === 'text' || inputType === 'mixed');
  const showChoices = typingComplete && !isTyping && (inputType === 'choices' || inputType === 'mixed');

  // Navigate to ending screen
  useEffect(() => {
    if (ending) {
      const timer = setTimeout(() => {
        router.push(`/ending?type=${ending}`);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [ending, router]);

  // Reset typing state on node change
  useEffect(() => {
    setTypingComplete(false);
    setTyping(true);
    setAtmosphericText(null);
  }, [currentNodeId, setTyping]);

  // Scroll to bottom as new content appears
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [typingComplete, currentNodeId, atmosphericText]);

  const handleTypingComplete = () => {
    setTypingComplete(true);
    setTyping(false);
  };

  const handleTextSubmit = async (userInput: string) => {
    if (!currentNode || visibleChoices.length === 0) return;

    setIsProcessingText(true);

    try {
      const res = await fetch('/api/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: currentNodeId,
          nodeText: Array.isArray(currentNode.text) ? currentNode.text : [currentNode.text],
          userInput,
          choices: visibleChoices,
          gameState,
        }),
      });

      const data = await res.json() as { choiceId: string; atmosphericText?: string };
      const matchedChoice = visibleChoices.find((c) => c.id === data.choiceId) ?? visibleChoices[0];

      if (data.atmosphericText) {
        setAtmosphericText(data.atmosphericText);
        // Small delay to show atmospheric text before navigating
        setTimeout(() => {
          makeChoice(matchedChoice);
          setIsProcessingText(false);
        }, 2200);
      } else {
        makeChoice(matchedChoice);
        setIsProcessingText(false);
      }
    } catch {
      // Fallback: route to first choice on error
      makeChoice(visibleChoices[0]);
      setIsProcessingText(false);
    }
  };

  if (!currentNode) {
    return (
      <div className="terminal-panel flex items-center justify-center">
        <p className="terminal-text opacity-50">SIGNAL LOST</p>
      </div>
    );
  }

  const nodeText = getNodeText(currentNode);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AmbientAudio />
      <GlitchOverlay intensity={glitchIntensity} active={isGlitching} />

      <div className="terminal-panel w-full max-w-2xl flex flex-col" style={{ height: '90vh' }}>
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b shrink-0"
          style={{ borderColor: '#1a2a1a', backgroundColor: 'rgba(0,255,65,0.03)' }}
        >
          <span style={{ color: '#008f11', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace' }}>
            DESCEND v0.1 — MATRIX SIMULATION
          </span>
          <div className="flex items-center gap-4">
            <span style={{ color: '#004d09', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace' }}>
              T:{gameState.timeElapsed}s
            </span>
            <span
              style={{
                color: gameState.dangerLevel > 3 ? '#ff0040' : '#004d09',
                fontSize: '0.65rem',
                fontFamily: 'JetBrains Mono, monospace',
                transition: 'color 0.3s',
              }}
            >
              THREAT:{gameState.dangerLevel}
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-6 py-6"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Node ID breadcrumb */}
          <p
            style={{
              color: '#003300',
              fontSize: '0.6rem',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '20px',
              letterSpacing: '0.1em',
            }}
          >
            {'>'} {currentNodeId.toUpperCase().replace(/_/g, ' ')}
          </p>

          <TypewriterText
            lines={nodeText}
            speed={currentNode.meta ? 20 : 28}
            onComplete={handleTypingComplete}
            skipable={true}
          />

          {/* Atmospheric text from AI (bridge between input and next node) */}
          {atmosphericText && (
            <p
              style={{
                color: '#008f11',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.85rem',
                lineHeight: '1.7',
                marginTop: '24px',
                fontStyle: 'italic',
                opacity: 0.8,
              }}
            >
              {atmosphericText}
            </p>
          )}

          {/* Free text input */}
          {showTextInput && !atmosphericText && (
            <FreeTextInput
              prompt={currentNode.textPrompt ?? 'What do you do?'}
              onSubmit={handleTextSubmit}
              disabled={isGlitching}
              isProcessing={isProcessingText}
            />
          )}

          {/* Choice buttons (always shown for 'choices', shown below text input for 'mixed') */}
          {showChoices && !atmosphericText && (
            <ChoiceList
              choices={visibleChoices}
              onChoice={makeChoice}
              disabled={isTyping || isGlitching || isProcessingText}
            />
          )}

          {ending && (
            <p
              style={{
                color: '#003300',
                fontSize: '0.65rem',
                fontFamily: 'JetBrains Mono, monospace',
                marginTop: '32px',
                animation: 'blink 1s step-end infinite',
              }}
            >
              TRANSMITTING RESULTS...
            </p>
          )}
        </div>

        {/* Bottom bar */}
        <div
          className="px-4 py-2 border-t shrink-0 flex items-center justify-between"
          style={{ borderColor: '#1a2a1a', backgroundColor: 'rgba(0,255,65,0.02)' }}
        >
          <span style={{ color: '#002200', fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {isTyping ? 'RECEIVING...' : isProcessingText ? 'INTERPRETING...' : 'AWAITING INPUT'}
          </span>
          <span style={{ color: '#002200', fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {gameState.loopCount > 0 ? `LOOP ${gameState.loopCount}` : 'NOMINAL'}
          </span>
        </div>
      </div>
    </div>
  );
}
