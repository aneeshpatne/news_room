import "dotenv/config";
import express from "express";
import { createClient } from "redis";

const app = express();
const redis = createClient({ host: "127.0.0.1", port: 6379 });
await redis.connect();

app.use(express.json());
const PORT = 3000;

app.get("/news_items", async (req, res) => {
  try {
    const allNews = await redis.lRange("newsCollection", 0, -1);

    if (allNews.length === 0) {
      return res.status(404).json({ error: "No news items available" });
    }

    const randomIndex = Math.floor(Math.random() * allNews.length);
    const randomNewsJson = allNews[randomIndex];
    const randomNews = JSON.parse(randomNewsJson);

    const response = {
      key: "news_items",
      value: {
        title: randomNews.title,
        summary: randomNews.description,
      },
      type: "json",
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching news item:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/alert-remark", async (req, res) => {
  try {
    const alertRemarkKey = await redis.get("alert-remark");

    if (!alertRemarkKey) {
      return res.status(404).json({ error: "alert-remark key not found" });
    }

    const response = {
      key: "alert-remark",
      value: alertRemarkKey,
      type: "key",
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching alert-remark key:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 News server running on http://localhost:${PORT}`);
  console.log(`📰 GET /news_items - Get a random news item`);
  console.log(`🔑 GET /alert-remark - Fetch the stored alert-remark key`);
});
