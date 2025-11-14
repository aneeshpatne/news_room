import { tool } from "ai";
import { describe } from "node:test";
import { title } from "process";
import { z } from "zod";

export const newsTool = tool({
  description: "Invoke this tool to save news snippets",
  inputSchema: z.object({
    title: z
      .string()
      .describe("The title of news snippet can be maximum of 3 words"),
    description: z
      .string()
      .describe(
        "The description of the news article can be maximum of 8 words."
      ),
  }),
  execute: async ({ title, description }) => {
    console.log({ title, description });
  },
});
