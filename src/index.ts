import { IMessageSDK } from "@photon-ai/imessage-kit";
import { processThought, generateDigest, handleSearch, parseTags } from "./brain.js";
import { addThought, getThoughtStats } from "./store.js";

// --- Config ---
// Set your phone number or Apple ID email so the agent only responds to YOU
const MY_IDENTIFIER = process.env.MY_PHONE || process.env.MY_EMAIL || "";

if (!MY_IDENTIFIER) {
  console.error("Set MY_PHONE or MY_EMAIL env var so the agent knows who you are.");
  console.error('Example: MY_PHONE="+6512345678" bun run src/index.ts');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Set ANTHROPIC_API_KEY env var.");
  process.exit(1);
}

const sdk = new IMessageSDK({ debug: false });

console.log(`🧠 Second Brain Agent started`);
console.log(`   Listening for messages from: ${MY_IDENTIFIER}`);
console.log(`   Commands: "digest", "search <topic>", "stats", or just text a thought`);
console.log(`   Press Ctrl+C to stop\n`);

await sdk.startWatching({
  onDirectMessage: async (msg) => {
    // Only respond to messages from YOU
    if (msg.isFromMe || msg.sender !== MY_IDENTIFIER) return;
    if (!msg.text || msg.text.trim().length === 0) return;

    const text = msg.text.trim();
    console.log(`📨 Received: "${text}"`);

    try {
      let reply: string;

      // Command: digest
      if (text.toLowerCase() === "digest") {
        console.log("📊 Generating digest...");
        reply = await generateDigest();
      }
      // Command: search <query>
      else if (text.toLowerCase().startsWith("search ")) {
        const query = text.slice(7).trim();
        console.log(`🔍 Searching: "${query}"`);
        reply = await handleSearch(query);
      }
      // Command: stats
      else if (text.toLowerCase() === "stats") {
        const s = getThoughtStats();
        reply = `${s.total} thoughts captured. ${s.thisWeek} this week.`;
        if (s.topTags.length > 0) {
          reply += `\n\nTop themes: ${s.topTags.map(([t, c]) => `${t} (${c})`).join(", ")}`;
        }
      }
      // Default: capture thought
      else {
        console.log("🧠 Processing thought...");
        const response = await processThought(text);
        const { reply: cleanReply, tags } = parseTags(response);
        reply = cleanReply;

        // Save to store
        addThought(text, tags, [], reply);
        console.log(`💾 Saved thought #${getThoughtStats().total} [${tags.join(", ")}]`);
      }

      // Send reply
      await sdk.send(msg.sender, reply);
      console.log(`✅ Replied: "${reply.substring(0, 80)}${reply.length > 80 ? "..." : ""}"\n`);
    } catch (err) {
      console.error("Error processing message:", err);
      await sdk.send(msg.sender, "Brain glitch — try again in a sec.");
    }
  },

  onError: (error) => {
    console.error("Watcher error:", error);
  },
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🧠 Shutting down Second Brain...");
  sdk.stopWatching();
  await sdk.close();
  process.exit(0);
});

// Keep alive
await new Promise(() => {});
