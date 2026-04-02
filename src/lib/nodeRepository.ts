import { GameNode } from '@/types/game';
import { supabase } from './supabase';
import localNodes from '@/data/matrix/nodes.json';

const CACHE_TTL_MS = 60_000; // 60 seconds

interface CacheEntry {
  nodes: GameNode[];
  fetchedAt: number;
}

const cache: Record<string, CacheEntry> = {};

function isCacheValid(storyId: string): boolean {
  const entry = cache[storyId];
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

async function fetchFromSupabase(storyId: string): Promise<GameNode[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('nodes')
    .select('data')
    .eq('story_id', storyId)
    .order('id');

  if (error || !data) {
    console.error('[nodeRepository] Supabase fetch failed:', error?.message);
    return null;
  }

  return data.map((row) => row.data as GameNode);
}

export async function getNodes(storyId = 'matrix'): Promise<GameNode[]> {
  if (isCacheValid(storyId)) {
    return cache[storyId].nodes;
  }

  const remote = await fetchFromSupabase(storyId);

  if (remote && remote.length > 0) {
    cache[storyId] = { nodes: remote, fetchedAt: Date.now() };
    return remote;
  }

  // Fallback: local JSON (always works, even without Supabase)
  const fallback = localNodes as GameNode[];
  cache[storyId] = { nodes: fallback, fetchedAt: Date.now() };
  return fallback;
}

export function getNodesSync(storyId = 'matrix'): GameNode[] {
  // Returns cached nodes synchronously — used by the game store.
  // Always populated after first getNodes() call.
  return cache[storyId]?.nodes ?? (localNodes as GameNode[]);
}

export function invalidateCache(storyId = 'matrix'): void {
  delete cache[storyId];
}
