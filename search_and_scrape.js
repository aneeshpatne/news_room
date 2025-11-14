import "dotenv/config";
import { chromium } from "playwright";
async function search(searchTerm) {
  const url = `https://www.googleapis.com/customsearch/v1?q=${searchTerm}&fields=items(link)&key=${process.env.API_KEY}&cx=${process.env.CX}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(data.items);
}

async function scrape(urls) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const results = await Promise.all(
    urls.map(async (url) => {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const textContent = await page.
      const title = await page.title();
      await page.close();
      return { url, title };
    })
  );
  console.log(results);
}

const date = new Date();
const searchTerm = `India News`;

console.log(`Searching for ${searchTerm}`);
// await search(searchTerm);
const urls = [
  { link: "https://www.ndtv.com/india" },
  { link: "https://news.google.com/home?hl=en-IN&gl=IN&ceid=IN%3Aen" },
  { link: "https://indianexpress.com/section/india/" },
  { link: "https://timesofindia.indiatimes.com/" },
  { link: "https://www.bbc.com/news/world/asia/india" },
  { link: "https://www.reuters.com/world/india/" },
  { link: "https://www.hindustantimes.com/india-news" },
  { link: "https://www.thehindu.com/news/national/" },
].map((item) => item.link);

await scrape(urls);
