import "dotenv/config";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { newsTool } from "./tools.js";
import { createClient } from "redis";

const redis = createClient({ host: "127.0.0.1", port: 6379 });
await redis.connect();

export async function news_aggregator(scrapedContent = null) {
  if (!scrapedContent || scrapedContent.length === 0) {
    console.log("No content to aggregate");
    return;
  }

  const contentContext = scrapedContent
    .map(
      (item, idx) =>
        `[${idx}] Title: ${item.title}\nContent: ${item.textContent.substring(
          0,
          500
        )}...`
    )
    .join("\n\n");
  const oldNews = await redis.lRange("newsCollection", 0, -1);
  const hasOldNews = oldNews.length > 0;
  const oldNewsString = hasOldNews
    ? oldNews.map((item) => JSON.parse(item).title).join(", ")
    : "";

  const prompt = `You are a professional news aggregator. Analyze the following scraped news content and extract ALL valuable, relevant news items. 

IMPORTANT RULES:
  1. Only extract news that is factual, newsworthy, and relevant
  2. Ignore repetitive or duplicate stories - merge similar news into ONE comprehensive item
  3. Skip irrelevant content like ads, navigation text, or non-news information
  ${
    hasOldNews
      ? `4. ALREADY AGGREGATED NEWS (DO NOT RE-EXTRACT): [${oldNewsString}]
  5. For each UNIQUE, NEW news story (NOT in the list above), invoke the newsTool to save it with:`
      : `4. For each unique news story, invoke the newsTool to save it with:`
  }
    - A concise 5-word title
    - A 15-word description that includes CONCRETE FACTS, NUMBERS, NAMES, or PLACES (not vague generalizations)
  ${
    hasOldNews ? `6` : `5`
  }. If a story cannot be meaningfully summarized or feels vague, skip it outright rather than stretching the description into filler.
  ${
    hasOldNews ? `7` : `6`
  }. Avoid open-ended "explained" style pieces (e.g., "5 reasons for BJP victory explained") that don't deliver a clear, closed-ended update; drop them unless a precise takeaway can be stated.
  ${
    hasOldNews ? `8` : `7`
  }. CRITICAL: Each description must be specific and descriptive—include WHO (person/organization), WHAT (action/event), and WHERE (location) when possible. Reject vague summaries like "Things are changing" or "Updates expected"—only extract concrete${
    hasOldNews ? `, NEW` : ``
  } news.

Extract as many unique, valuable ${
    hasOldNews ? `NEW ` : ``
  }news items as possible (aim for 15-20).

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
