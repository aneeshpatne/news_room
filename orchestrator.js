import { Queue, Worker } from "bullmq";
import { createClient } from "redis";
import { search, scrape } from "./search_and_scrape.js";
import { news_aggregator } from "./news_aggregator.js";

const connection = { host: "127.0.0.1", port: 6379 };
const redis = createClient(connection);
await redis.connect();

const scrapeQueue = new Queue("scrapeQueue", { connection });

// Clean up any stray jobs from previous runs
await scrapeQueue.clean(0, "wait");
await scrapeQueue.clean(0, "delayed");
await scrapeQueue.clean(0, "active");
console.log("🧹 Cleaned up stray jobs from queue");

// Schedule jobs at 15 minutes past each hour from 7:15am to 10:15pm (7-22)
// Cron: minute hour * * * (run at :15 of each hour in the window)
// Hour 0-23 in 24-hour format, so 7:15am-10:15pm = hours 7-22 at minute 15
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

console.log("📅 Scheduled jobs: 7:15am to 10:15pm (every hour at :15)");
console.log(`⏰ Cron pattern: "${cronPattern}"`);
console.log(
  "   → Runs at: 7:15am, 8:15am, 9:15am, 10:15am, ..., 9:15pm, 10:15pm (24-hour format)"
);

// Remove any pending/delayed jobs to ensure clean start (skip recurring jobs)
const jobs = await scrapeQueue.getJobs(["waiting", "delayed"]);
for (const job of jobs) {
  // Skip jobs that are part of a job scheduler (recurring jobs)
  if (!job.repeatJobKey) {
    await job.remove();
  }
}
console.log("🧹 Cleaned up pending/delayed jobs from queue");

const worker = new Worker(
  "scrapeQueue",
  async (job) => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes; // Convert to minutes for comparison
    const targetTime = 7 * 60 + 15; // 7:15 AM in minutes

    if (currentTime < targetTime) {
      console.log(
        `⏰ Current time ${now.toLocaleTimeString()} is before 7:15 AM. Deleting newsCollection key and skipping job.`
      );
      await redis.del("newsCollection");
      return { done: false, reason: "Before 7:15 AM - skipped" };
    }

    console.log(`🔧 Running job ${job.id} at ${now.toLocaleTimeString()}`);

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
