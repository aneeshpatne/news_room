import "dotenv/config";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function news_aggregator(scrapedContent) {
  const { text } = await generateText({
    model: openai("gpt-5-mini"),
    prompt: "say hi its a test",
  });
}
