import "dotenv/config";
import { chromium } from "playwright";

export async function search(searchTerm) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
      searchTerm
    )}&dateRestrict=d1&fields=items(link)&key=${process.env.API_KEY}&cx=${
      process.env.CX
    }`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.items) {
      return data.items.map((item) => item.link);
    } else {
      console.log("No search results found");
      return [];
    }
  } catch (error) {
    console.error(`Search failed: ${error.message}`);
    return [];
  }
}

export async function scrape(urls) {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          console.log(`Attempting to scrape: ${url}`);
          const page = await context.newPage();
          await page.goto(url, { waitUntil: "domcontentloaded" });
          const textContent = await page.evaluate(() =>
            document.body.innerText
              .trim()
              .replace(/\s+/g, " ")
              .substring(0, 5000)
          );
          const title = await page.title();
          console.log(
            `Successfully scraped: ${title} (${textContent.length} chars)`
          );
          await page.close();
          return { url, title, textContent };
        } catch (error) {
          console.error(`Failed to scrape ${url}: ${error.message}`);
          return null;
        }
      })
    );
    await browser.close();
    return results.filter((r) => r !== null);
  } catch (error) {
    console.error(`Scrape failed: ${error.message}`);
    return [];
  }
}
