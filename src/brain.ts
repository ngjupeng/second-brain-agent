import { chat } from "./llm.js";
import {
  getRecentThoughts,
  searchThoughts,
  getThoughtStats,
  type Thought,
} from "./store.js";

function formatThoughts(thoughts: Thought[]): string {
  return thoughts
    .map(
      (t) =>
        `[#${t.id} | ${new Date(t.timestamp).toLocaleDateString()} ${new Date(t.timestamp).toLocaleTimeString()}] ${t.text}${t.tags.length ? ` (tags: ${t.tags.join(", ")})` : ""}`
    )
    .join("\n");
}

const THOUGHT_SYSTEM = `You are a "Second Brain" — an iMessage agent that captures thoughts and makes the user think deeper.

Your job:
1. Acknowledge the thought briefly (1 short sentence max)
2. Connect it to any previous thoughts if relevant — reference them by topic, not ID
3. Ask ONE provocative follow-up question that pushes the user to think harder

Rules:
- Be concise. This is iMessage, not an essay. Keep total response under 3-4 sentences.
- Sound like a sharp friend, not an AI assistant
- Don't be generic. Be specific to what they said.
- If you see a pattern or contradiction with previous thoughts, call it out
- Never say "great thought" or "interesting" — just get to the point
- Return 1-3 relevant tags for this thought as the LAST line, formatted as: tags: tag1, tag2, tag3`;

const DIGEST_SYSTEM = `You summarize someone's thinking patterns from their captured thoughts. Be insightful, not generic.

Format for iMessage (short paragraphs, no markdown):
1. What they've been thinking about most (2-3 themes)
2. Any interesting patterns, contradictions, or evolution in thinking
3. One connection between thoughts they probably didn't notice
4. One question to chew on based on everything

Keep it under 6-8 short sentences total. Sound like a sharp friend reviewing their journal.`;

export async function processThought(incomingText: string): Promise<string> {
  const recentThoughts = getRecentThoughts(30);
  const previousContext =
    recentThoughts.length > 0
      ? formatThoughts(recentThoughts)
      : "No previous thoughts yet.";

  return chat(
    THOUGHT_SYSTEM,
    `Previous thoughts from this person:\n${previousContext}\n\n---\nNew thought just texted in:\n"${incomingText}"`,
    300
  );
}

export async function generateDigest(): Promise<string> {
  const stats = getThoughtStats();
  const recent = getRecentThoughts(50);

  if (recent.length === 0) {
    return "No thoughts captured yet. Text me anything — a random idea, something you noticed, a question you can't shake.";
  }

  return chat(
    DIGEST_SYSTEM,
    `Stats: ${stats.total} total thoughts, ${stats.thisWeek} this week. Top tags: ${stats.topTags.map(([t, c]) => `${t}(${c})`).join(", ") || "none yet"}\n\nRecent thoughts:\n${formatThoughts(recent)}`,
    500
  );
}

export async function handleSearch(query: string): Promise<string> {
  const results = searchThoughts(query);

  if (results.length === 0) {
    return `Nothing on "${query}" yet. Maybe that's your next thought?`;
  }

  const formatted = results
    .slice(0, 10)
    .map(
      (t) =>
        `• ${new Date(t.timestamp).toLocaleDateString()}: ${t.text.substring(0, 100)}${t.text.length > 100 ? "..." : ""}`
    )
    .join("\n");

  return `Found ${results.length} thought${results.length > 1 ? "s" : ""} on "${query}":\n\n${formatted}`;
}

export function parseTags(response: string): {
  reply: string;
  tags: string[];
} {
  const lines = response.split("\n");
  const tagLine = lines.find((l) =>
    l.toLowerCase().startsWith("tags:")
  );

  if (tagLine) {
    const tags = tagLine
      .replace(/^tags:\s*/i, "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const reply = lines
      .filter((l) => l !== tagLine)
      .join("\n")
      .trim();
    return { reply, tags };
  }

  return { reply: response, tags: [] };
}
