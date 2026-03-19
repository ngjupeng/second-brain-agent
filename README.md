# Second Brain — iMessage Agent

An iMessage agent that captures your raw thoughts throughout the day, connects the dots you missed, and pushes you to think deeper.

> "I text my half-baked thoughts and my agent connects the dots I missed."

Built with [Photon iMessage Kit](https://github.com/photon-hq/imessage-kit) + Claude or Gemini API.

## Why

- You're watching a video fullscreen and have a thought — grab your phone, text it. No app switching.
- AI is making us lazy thinkers. This agent fights back — it asks you hard questions instead of giving you easy answers.
- Over time it builds a map of YOUR thinking patterns, contradictions, and blind spots.

## How It Works

1. Text any thought to the agent
2. It saves the thought, finds connections to your previous ideas, and asks a provocative follow-up
3. Text `digest` to get a weekly summary of your thinking patterns
4. Text `search <topic>` to find related past thoughts
5. Text `stats` to see your thought count and top themes

## Setup

**Requirements:** macOS, Bun, Gemini or Anthropic API key

```bash
# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Clone and install
git clone https://github.com/ngjupeng/second-brain-agent
cd second-brain-agent
bun install

# Configure
cp .env.example .env
# Edit .env with your API key and phone number

# Grant Full Disk Access
# System Settings → Privacy & Security → Full Disk Access → Add your terminal app

# Run
bun run start
```

Then text yourself from another device (or ask a friend to text you) and the agent replies.

## Commands

| Text | Action |
|------|--------|
| Any text | Captures thought, finds connections, asks follow-up |
| `digest` | Weekly summary of your thinking patterns |
| `search payments` | Find past thoughts about payments |
| `stats` | Total thoughts, this week count, top themes |

## Architecture

```
Phone (iMessage) → macOS iMessage DB → Watcher (polls every 2s)
    → LLM (Claude or Gemini — processes thought, finds connections)
    → brain.json (persistent storage)
    → iMessage reply back to you
```

## Built for Photon Residency Chapter II

This agent explores the question: *Can an AI make you think better instead of thinking for you?*

Most AI tools replace your thinking. This one catches your raw thoughts in their rawest form — while you're watching a video, walking, in a meeting — and forces you to finish baking them.
