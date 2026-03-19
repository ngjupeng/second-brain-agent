import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Provider = "claude" | "gemini";

const provider: Provider = process.env.GEMINI_API_KEY ? "gemini" : "claude";

let anthropic: Anthropic | null = null;
let gemini: GoogleGenerativeAI | null = null;

if (provider === "claude") {
  anthropic = new Anthropic();
} else {
  gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

export async function chat(
  system: string,
  userMessage: string,
  maxTokens: number = 300
): Promise<string> {
  if (provider === "claude" && anthropic) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  if (provider === "gemini" && gemini) {
    const model = gemini.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: system,
    });
    const result = await model.generateContent(userMessage);
    return result.response.text();
  }

  throw new Error("No LLM provider configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY.");
}

export function getProviderName(): string {
  return provider === "claude" ? "Claude" : "Gemini";
}
