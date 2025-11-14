import "dotenv/config";

async function search(searchTerm) {
  const url = `https://www.googleapis.com/customsearch/v1?q=${searchTerm}&fields=items(link)&key=${process.env.API_KEY}&cx=${process.env.CX}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(data.items);
}
const date = new Date();
const searchTerm = `India News`;
console.log(`Searching for ${searchTerm}`);
// await search(searchTerm);

async function scrape(urls) {}
