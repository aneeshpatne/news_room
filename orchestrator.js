import { Queue, Worker } from "bullmq";

const connection = { host: "127.0.0.1", port: 6379 };

const scrapeQueue = new Queue("scrapeQueue", { connection });

await scrapeQueue.add("sample-job");

const worker = new Worker(
  "scrapeQueue",
  async (job) => {
    console.log(`🔧 Running job ${job.id}`, job.data);

    // Your scraping logic here
    return { done: true };
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});
