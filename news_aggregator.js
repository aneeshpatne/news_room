import "dotenv/config";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { newsTool } from "./tools.js";
export async function news_aggregator(scrapedContent = null) {
  const { text } = await generateText({
    model: openai("gpt-5-mini"),
    prompt: "Invoke the news tool for a test 4-5 times please",
    tools: [newsTool],
  });
}

await news_aggregator();
