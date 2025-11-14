import { tool } from "ai";
import { createClient } from "redis";
import { z } from "zod";

const redis = createClient({ host: "127.0.0.1", port: 6379 });
await redis.connect();

export const newsTool = tool({
  description: "Invoke this tool to save news snippets",
  inputSchema: z.object({
    title: z
      .string()
      .describe("The title of news snippet can be maximum of 5 words"),
    description: z
      .string()
      .describe(
        "The description of the news article can be maximum of 10 words."
      ),
  }),
  execute: async ({ title, description }) => {
    const newsItem = { title, description };
    await redis.rPush("newsCollection", JSON.stringify(newsItem));
    console.log(`📌 Saved: ${title} - ${description}`);
    return { success: true, message: "News item saved" };
  },
});
