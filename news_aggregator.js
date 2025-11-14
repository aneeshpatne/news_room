import "dotenv/config";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { newsTool } from "./tools.js";

export async function news_aggregator(scrapedContent = null) {
  if (!scrapedContent || scrapedContent.length === 0) {
    console.log("No content to aggregate");
    return;
  }

  // Build context from scraped content
  const contentContext = scrapedContent
    .map(
      (item, idx) =>
        `[${idx}] Title: ${item.title}\nContent: ${item.textContent.substring(
          0,
          500
        )}...`
    )
    .join("\n\n");

  const prompt = `You are a professional news aggregator. Analyze the following scraped news content and extract ALL valuable, relevant news items. 

IMPORTANT RULES:
1. Only extract news that is factual, newsworthy, and relevant
2. Ignore repetitive or duplicate stories - merge similar news into ONE comprehensive item
3. Skip irrelevant content like ads, navigation text, or non-news information
4. For each unique news story, invoke the newsTool to save it with:
   - A concise 5-word title
   - A 10-word description

Extract as many unique, valuable news items as possible (aim for 15-20).

The scraped content spans India-wide coverage and Mumbai-specific updates, so capture both perspectives.

SCRAPED CONTENT:
${contentContext}`;

  const { text } = await generateText({
    model: openai("gpt-5-mini"),
    prompt: prompt,
    tools: [newsTool],
  });

  console.log("\n✅ Aggregation complete");
  return text;
}
