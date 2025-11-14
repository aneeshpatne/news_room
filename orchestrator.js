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

// Schedule jobs at 15 minutes past each hour from 7:15am to 10:15am (7, 8, 9, 10)
// Cron: minute hour * * * (run at :15 of each hour in the window)
// Hour 0-23 in 24-hour format, so 7:15am-10:15am = hours 7-10 at minute 15
const cronPattern = "15 7-22 * * *";

await scrapeQueue.add(
  "scheduled-job",
  {},
  {
    repeat: {
      pattern: cronPattern,
    },
  }
);

console.log("📅 Scheduled jobs: 7:15am to 10:15am (every hour at :15)");
console.log(`⏰ Cron pattern: "${cronPattern}"`);
console.log("   → Runs at: 7:15am, 8:15am, 9:15am, 10:15am (24-hour format)");

const worker = new Worker(
  "scrapeQueue",
  async (job) => {
    console.log(
      `🔧 Running job ${job.id} at ${new Date().toLocaleTimeString()}`
    );

    // Reset news collection for fresh execution
    await redis.del("newsCollection");

    // Search and scrape
    const indiaUrls = await search("India News");
    const mumbaiUrls = await search("Mumbai News");
    const mergedSearchUrls = Array.from(new Set([...indiaUrls, ...mumbaiUrls]));
    console.log(
      `🔍 Merged India + Mumbai search returned ${mergedSearchUrls.length} URLs`
    );
    const scrapedContent = await scrape(mergedSearchUrls);

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
