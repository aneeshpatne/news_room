import { Queue, Worker } from "bullmq";
import { createClient } from "redis";
import { search, scrape } from "./search_and_scrape.js";
import { news_aggregator } from "./news_aggregator.js";

const connection = { host: "127.0.0.1", port: 6379 };
const redis = createClient(connection);
await redis.connect();

const scrapeQueue = new Queue("scrapeQueue", { connection });

// Reset the news collection at the start of each job
await redis.del("newsCollection");

await scrapeQueue.add("sample-job");

const worker = new Worker(
  "scrapeQueue",
  async (job) => {
    console.log(`🔧 Running job ${job.id}`, job.data);

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
  console.log(`✅ Job ${job.id} completed`);
  // Get results from Redis
  const results = await redis.lRange("newsCollection", 0, -1);
  console.log(`📰 News items extracted: ${results.length}`);
  results.forEach((item) => console.log(JSON.parse(item)));
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});
