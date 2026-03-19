import { readFileSync, writeFileSync, existsSync } from "fs";

export interface Thought {
  id: number;
  text: string;
  timestamp: string;
  tags: string[];
  connections: number[]; // IDs of related thoughts
  followUp?: string; // The agent's response
}

interface Store {
  thoughts: Thought[];
  nextId: number;
}

const STORE_PATH = "./brain.json";

function load(): Store {
  if (existsSync(STORE_PATH)) {
    return JSON.parse(readFileSync(STORE_PATH, "utf-8"));
  }
  return { thoughts: [], nextId: 1 };
}

function save(store: Store) {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function addThought(
  text: string,
  tags: string[] = [],
  connections: number[] = [],
  followUp?: string
): Thought {
  const store = load();
  const thought: Thought = {
    id: store.nextId++,
    text,
    timestamp: new Date().toISOString(),
    tags,
    connections,
    followUp,
  };
  store.thoughts.push(thought);
  save(store);
  return thought;
}

export function getAllThoughts(): Thought[] {
  return load().thoughts;
}

export function getRecentThoughts(n: number = 20): Thought[] {
  const thoughts = load().thoughts;
  return thoughts.slice(-n);
}

export function searchThoughts(query: string): Thought[] {
  const lower = query.toLowerCase();
  return load().thoughts.filter((t) =>
    t.text.toLowerCase().includes(lower) ||
    t.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
}

export function getThoughtStats(): {
  total: number;
  thisWeek: number;
  topTags: [string, number][];
} {
  const thoughts = load().thoughts;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = thoughts.filter((t) => new Date(t.timestamp) > weekAgo);

  const tagCounts = new Map<string, number>();
  for (const t of thoughts) {
    for (const tag of t.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return { total: thoughts.length, thisWeek: thisWeek.length, topTags };
}
