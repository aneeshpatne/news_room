# News Room 📰

A powerful, automated news aggregation system that searches, scrapes, and intelligently summarizes news articles using AI.

## Features 🚀

- **Automated Web Scraping**: Uses Playwright to scrape content from multiple news sources
- **Google Custom Search Integration**: Fetches relevant news articles via Google Search API
- **AI-Powered Aggregation**: Uses OpenAI's GPT to intelligently extract and summarize news
- **Smart Deduplication**: Merges similar news items and filters irrelevant content
- **Job Queue System**: BullMQ-based job scheduler for reliable background processing
- **Cron-Based Scheduling**: Automatically runs news aggregation hourly from 7am to 11pm
- **Redis Storage**: Efficiently stores extracted news items
- **REST API**: Express server providing random news items on demand

## Architecture 🏗️

```
search_and_scrape.js  →  news_aggregator.js  →  orchestrator.js  →  server.js
     (Search)              (AI Processing)        (Job Queue)        (API)
```

### Core Components

1. **search_and_scrape.js** - Web scraping engine

   - `search(searchTerm)` - Returns URLs from Google Custom Search
   - `scrape(urls)` - Extracts content from URLs using Playwright

2. **news_aggregator.js** - AI intelligence

   - Analyzes scraped content
   - Extracts 15-20 unique, valuable news items
   - Generates concise 5-word titles and 10-word descriptions

3. **orchestrator.js** - Job scheduler & pipeline

   - BullMQ queue management
   - Cron-based scheduling (hourly 7am-11pm)
   - Coordinates search → scrape → aggregate workflow
   - Redis integration

4. **tools.js** - AI tool definitions

   - `newsTool` - Saves news items to Redis with schema validation

5. **server.js** - REST API
   - `GET /news_items` - Returns a random news item from collection

## Installation 📦

```bash
npm install
```

### Prerequisites

- Node.js 16+
- Redis server running on localhost:6379
- OpenAI API key
- Google Custom Search API key and CX ID

## Environment Variables 🔐

Create a `.env` file with:

```
API_KEY=your_google_custom_search_api_key
CX=your_google_custom_search_cx_id
OPENAI_API_KEY=your_openai_api_key
```

> **Note**: `.env` is in `.gitignore` - never commit sensitive keys!

## Usage 🎯

### Start the News Aggregator (Scheduled)

```bash
node orchestrator.js
```

This will:

- Start the BullMQ worker
- Schedule hourly jobs from 7am to 11pm
- Automatically search, scrape, and aggregate news every hour
- Store results in Redis

### Start the API Server

```bash
node server.js
```

Server runs on `http://localhost:3000`

**API Endpoint:**

```bash
curl http://localhost:3000/news_items
```

**Response:**

```json
{
  "key": "news_items",
  "value": {
    "title": "Weather Update Forecast",
    "summary": "Temperature expected to rise across major cities"
  },
  "type": "json"
}
```

### Run One-Time Aggregation

```bash
node news_aggregator.js
```

## Data Flow 📊

```
1. Orchestrator triggers job (hourly 7am-11pm)
2. Search: Query "India News" via Google Custom Search API
3. Scrape: Extract content from 5-10 URLs using Playwright
4. Validate: Check content types (url, title, textContent)
5. Aggregate: AI processes content via OpenAI GPT
6. Extract: AI invokes newsTool to save news items
7. Store: News items saved to Redis (newsCollection list)
8. Serve: API returns random items on demand
```

## News Item Schema 📋

Each news item contains:

```javascript
{
  title: "5-word concise headline",
  description: "10-word description with key details"
}
```

**Processing Rules:**

- Merges similar/duplicate stories into one item
- Skips irrelevant content (ads, navigation text)
- Extracts 15-20 unique, valuable news items per run
- Fresh collection per job execution

## Cron Schedule ⏰

```
Pattern: 0 7-23 * * *
Hours: 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23
Time: Every hour from 7am to 11pm (24-hour format)
Frequency: 17 jobs per day
```

## API Reference 🔌

### GET /news_items

Returns a random news item from the Redis collection.

**Response:**

```json
{
  "key": "news_items",
  "value": {
    "title": "string (max 5 words)",
    "summary": "string (max 10 words)"
  },
  "type": "json"
}
```

**Status Codes:**

- `200` - Success
- `404` - No news items available
- `500` - Server error

### GET /alert-remark

Returns the existing `alert-remark:key` value stored in Redis so the caller can forward it to downstream systems.

**Response:**

```json
{
  "key": "alert-remark",
  "value": "alert-remark-xxxxx",
  "type": "key"
}
```

**Status Codes:**

- `200` - Success
- `404` - alert-remark key not found
- `500` - Server error

## Technology Stack 🛠️

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Playwright** - Web scraping
- **BullMQ** - Job queue
- **Redis** - Data storage
- **OpenAI SDK** - AI integration
- **Zod** - Schema validation

## Project Structure 📁

```
news_room/
├── orchestrator.js        # Job scheduler & pipeline
├── search_and_scrape.js   # Web scraping engine
├── news_aggregator.js     # AI aggregation logic
├── tools.js               # AI tool definitions
├── server.js              # REST API server
├── package.json           # Dependencies
├── .env                   # Environment variables (gitignored)
├── .gitignore             # Git ignore rules
└── readme.md              # This file
```

## Development 💻

### Running in Development Mode

```bash
# Terminal 1: Start the orchestrator
node orchestrator.js

# Terminal 2: Start the API server
node server.js

# Terminal 3: Make requests (optional)
curl http://localhost:3000/news_items
```

### Viewing Logs

The orchestrator logs:

- Job start/completion times
- Content validation
- News extraction count
- Extracted news items

The API server logs:

- Request times
- Response details

## Performance Considerations ⚡

- **Scraping timeout**: 30-60 seconds per URL
- **Content limit**: 5000 characters per page
- **AI processing**: ~10-30 seconds per batch
- **Job frequency**: 17 jobs/day (hourly 7am-11pm)
- **Redis storage**: Efficient list-based storage

---
