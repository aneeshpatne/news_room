import { Queue, Worker } from "bullmq";
import { createClient } from "redis";
import { search, scrape } from "./search_and_scrape.js";
import { news_aggregator } from "./news_aggregator.js";

const connection = { host: "127.0.0.1", port: 6379 };
const redis = createClient(connection);
await redis.connect();

const scrapeQueue = new Queue("scrapeQueue", { connection });

// Reset the news collection at the start
await redis.del("newsCollection");

// Schedule jobs hourly from 7am to 11pm (7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23)
// Cron: minute hour * * * (run at top of each hour)
// Hour 0-23 in 24-hour format, so 7am-11pm = hours 7-23
const cronPattern = "0 7-23 * * *";

await scrapeQueue.add(
  "scheduled-job",
  {},
  {
    repeat: {
      pattern: cronPattern,
    },
  }
);

console.log("📅 Scheduled jobs: Hourly from 7am to 11pm");
console.log(`⏰ Cron pattern: "${cronPattern}"`);
console.log(
  "   → Runs at: 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23 (24-hour format)"
);

const worker = new Worker(
  "scrapeQueue",
  async (job) => {
    console.log(
      `🔧 Running job ${job.id} at ${new Date().toLocaleTimeString()}`
    );

    // Reset news collection for fresh execution
    await redis.del("newsCollection");

    // Search and scrape
    const urls = await search("India News");
    const scrapedContent = await scrape(urls);

    // Content validation
    console.log(`📊 Content types validation:`);
    scrapedContent.forEach((item, idx) => {
      console.log(
        `  [${idx}] url: ${typeof item.url}, title: ${typeof item.title}, textContent: ${typeof item.textContent}`
      );
    });

    // Pass to aggregator
    await news_aggregator(scrapedContent);

    return { done: true, itemsProcessed: scrapedContent.length };
  },
  { connection }
);

worker.on("completed", async (job) => {
  console.log(
    `✅ Job ${job.id} completed at ${new Date().toLocaleTimeString()}`
  );
  // Get results from Redis
  const results = await redis.lRange("newsCollection", 0, -1);
  console.log(`📰 News items extracted: ${results.length}`);
  results.forEach((item) => console.log(JSON.parse(item)));
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});
