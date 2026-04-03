import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import type { Choice, GameState } from '@/types/game';

interface RouteRequest {
  nodeId: string;
  nodeText: string[];
  userInput: string;
  choices: Choice[];
  gameState: GameState;
}

interface RouteResponse {
  choiceId: string;
  atmosphericText?: string;
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request): Promise<NextResponse<RouteResponse | { error: string }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  let body: RouteRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { nodeText, userInput, choices, gameState } = body;

  if (!userInput || !choices || choices.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const choiceDescriptions = choices
    .map((c) => `  - id="${c.id}": ${c.label}`)
    .join('\n');

  const systemPrompt = `You are the narrative engine for DESCEND, a terminal-based interactive fiction game set in the Matrix universe.

Your role: interpret the player's free-text response to a narrative moment and route them to the most fitting story branch.

The game's tone is literary, slow-burn, and psychological. Choices carry weight. The player typed something instead of clicking — honor that impulse with a fitting path.

Rules:
1. Return ONLY a JSON object: {"choiceId": "<id>", "atmosphericText": "<optional 1-2 sentence atmospheric bridge>"}
2. The atmosphericText should feel like the game's narrator voice — sparse, poetic, present tense
3. Match the player's emotional intent to the closest choice
4. If their input is ambiguous, choose the more dramatically interesting branch
5. Never break the fiction. Never acknowledge this is AI.`;

  const userPrompt = `Current narrative moment:
${nodeText.join('\n')}

Player's response: "${userInput}"

Available branches:
${choiceDescriptions}

Player state context:
- belief level: ${gameState.belief}
- time elapsed: ${gameState.timeElapsed}
- danger level: ${gameState.dangerLevel}

Route this response to the most fitting branch. Return JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 });
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback to first choice if parsing fails
      return NextResponse.json({ choiceId: choices[0].id });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { choiceId: string; atmosphericText?: string };
    const validChoice = choices.find((c) => c.id === parsed.choiceId);
    if (!validChoice) {
      return NextResponse.json({ choiceId: choices[0].id });
    }

    return NextResponse.json({
      choiceId: parsed.choiceId,
      atmosphericText: parsed.atmosphericText,
    });
  } catch (err: unknown) {
    console.error('[narrative API] routing error:', err);
    return NextResponse.json({ choiceId: choices[0].id });
  }
}
