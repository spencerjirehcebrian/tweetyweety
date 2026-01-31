# TweetyWeety - Specification Document

## Overview

**TweetyWeety** is a simple Next.js application that converts URLs (Twitter/X posts, threads, and web articles) into clean, readable text. The app should work without requiring any paid API keys.

## Goals

- Accept a URL input from the user
- Detect the type of content (Twitter/X post, Twitter/X thread, or article)
- Extract and display clean text content
- Provide copy-to-clipboard functionality
- Keep the UI minimal and fast

## Technical Stack

- **Framework**: Next.js (App Router recommended)
- **Styling**: Tailwind CSS (keep it simple)
- **HTML Parsing**: `cheerio` for server-side HTML parsing
- **Article Extraction**: `@mozilla/readability` + `jsdom` for article content extraction
- **No database required**

## Architecture

```
┌─────────────────┐
│   Frontend UI   │
│  (React/Next)   │
└────────┬────────┘
         │ POST /api/parse
         │ { url: "https://..." }
         ▼
┌─────────────────┐
│  API Route      │
│  /api/parse     │
├─────────────────┤
│ 1. Detect type  │
│ 2. Fetch HTML   │
│ 3. Parse/Extract│
│ 4. Return text  │
└─────────────────┘
```

## URL Detection Logic

The API should detect the URL type:

```javascript
function detectUrlType(url) {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return 'twitter';
  }
  
  // Add more platform detection as needed
  return 'article';
}
```

## Content Extraction Strategies

### Strategy 1: Twitter/X Posts and Threads

**Primary Approach - Use fxtwitter.com or vxtwitter.com mirrors:**

These services return tweet content in HTML (unlike twitter.com which requires JavaScript rendering).

**Research Tasks:**
1. Verify fxtwitter.com is still operational
2. Verify vxtwitter.com is still operational  
3. Test which service returns better/more reliable HTML structure
4. Determine where tweet text is located in the HTML (likely in Open Graph meta tags or specific elements)
5. Test with single tweets, threads, and quote tweets
6. Check if media captions/alt text are available

**Implementation approach:**
```javascript
async function fetchTwitterContent(originalUrl) {
  // Convert: https://twitter.com/user/status/123 
  // To:      https://fxtwitter.com/user/status/123
  
  const url = new URL(originalUrl);
  url.hostname = 'fxtwitter.com'; // or vxtwitter.com
  
  const response = await fetch(url.toString());
  const html = await response.text();
  
  // Parse and extract tweet text
  // Check: meta tags, og:description, specific divs
}
```

**Fallback approaches (if mirrors fail):**
1. Try alternative mirror services (research if others exist)
2. Return error with manual paste option in UI

**Thread handling:**
- Research if fxtwitter handles threads automatically
- If not, may need to follow reply chains (could be complex)
- Consider MVP: support single tweets first, threads as stretch goal

### Strategy 2: Web Articles

**Primary Approach - Use Mozilla Readability:**

```javascript
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

async function fetchArticleContent(url) {
  const response = await fetch(url);
  const html = await response.text();
  
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  
  return {
    title: article.title,
    content: article.textContent, // or article.content for HTML
    excerpt: article.excerpt,
    byline: article.byline,
    siteName: article.siteName,
  };
}
```

**Research Tasks:**
1. Test Readability with various popular sites (Medium, Substack, news sites)
2. Identify sites that block server-side fetching (may return 403/captcha)
3. Check if User-Agent header helps with blocked sites
4. Test with paywalled content (expected: will only get preview)

**Edge cases to handle:**
- Sites that block non-browser requests
- Sites with aggressive anti-bot measures
- Pages that require JavaScript rendering (SPA sites)
- PDFs and other non-HTML content

## API Design

### Endpoint: `POST /api/parse`

**Request:**
```json
{
  "url": "https://twitter.com/user/status/123456"
}
```

**Success Response:**
```json
{
  "success": true,
  "type": "twitter",
  "data": {
    "text": "This is the tweet content...",
    "author": "@username",
    "timestamp": "2024-01-15T12:00:00Z",
    "metrics": {
      "likes": 1234,
      "retweets": 567
    }
  }
}
```

**Article Success Response:**
```json
{
  "success": true,
  "type": "article",
  "data": {
    "title": "Article Title",
    "text": "Article content...",
    "author": "Author Name",
    "siteName": "Example News",
    "excerpt": "Brief summary..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "FETCH_FAILED",
  "message": "Could not fetch content from this URL",
  "suggestion": "Try pasting the content manually"
}
```

## Frontend UI

### Layout

Keep it minimal:

```
┌──────────────────────────────────────────┐
│  TweetyWeety                             │
├──────────────────────────────────────────┤
│                                          │
│  [________________________] [Convert]    │
│   Paste Twitter/X or article URL         │
│                                          │
├──────────────────────────────────────────┤
│  Result:                                 │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  Extracted text appears here...    │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Copy to Clipboard]                     │
│                                          │
└──────────────────────────────────────────┘
```

### States to Handle

1. **Empty** - Initial state, input field empty
2. **Loading** - Fetching and parsing content
3. **Success** - Display extracted text with copy button
4. **Error** - Show error message with suggestion
5. **Manual Fallback** - Show textarea for manual paste (Twitter fallback)

### UI Components Needed

- URL input field with validation
- Submit/Convert button
- Loading spinner
- Result display area (pre-formatted text)
- Copy to clipboard button with feedback
- Error message display
- Manual paste textarea (collapsible, for fallback)

## Error Handling

| Error Code | Meaning | User Message |
|------------|---------|--------------|
| INVALID_URL | URL format invalid | "Please enter a valid URL" |
| FETCH_FAILED | Could not fetch URL | "Could not access this URL. The site may be blocking requests." |
| PARSE_FAILED | HTML parsing failed | "Could not extract content from this page" |
| TWITTER_MIRROR_DOWN | fxtwitter/vxtwitter unavailable | "Twitter extraction is temporarily unavailable. Please paste the tweet text manually." |
| EMPTY_CONTENT | No content extracted | "No readable content found on this page" |

## Testing Checklist

### Twitter/X URLs to Test
- [ ] Single tweet: `https://twitter.com/username/status/123`
- [ ] Single tweet (x.com): `https://x.com/username/status/123`
- [ ] Tweet with image
- [ ] Tweet with video
- [ ] Tweet thread (multiple tweets)
- [ ] Quote tweet
- [ ] Tweet with poll
- [ ] Deleted tweet (should error gracefully)
- [ ] Private account tweet (should error gracefully)

### Article URLs to Test
- [ ] Medium article
- [ ] Substack post
- [ ] Major news site (NYT, BBC, etc.)
- [ ] Blog post (WordPress)
- [ ] GitHub README
- [ ] Wikipedia article
- [ ] Site with paywall
- [ ] Site with anti-bot protection

## Implementation Order

1. **Phase 1: Project Setup**
   - Initialize Next.js project
   - Install dependencies (cheerio, @mozilla/readability, jsdom)
   - Set up basic folder structure

2. **Phase 2: Article Extraction**
   - Implement `/api/parse` endpoint
   - Add Readability-based article extraction
   - Test with various article sites

3. **Phase 3: Twitter Extraction**
   - Research and verify fxtwitter/vxtwitter approach
   - Implement Twitter URL detection and conversion
   - Parse tweet content from mirror HTML
   - Add fallback handling

4. **Phase 4: Frontend**
   - Build minimal UI with input and result display
   - Add loading and error states
   - Implement copy to clipboard
   - Add manual paste fallback for Twitter

5. **Phase 5: Polish**
   - Error handling improvements
   - Loading states
   - Mobile responsiveness
   - Basic styling cleanup

## Dependencies

```json
{
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "@mozilla/readability": "^0.5.0",
    "jsdom": "^24.0.0",
    "cheerio": "^1.0.0-rc.12"
  },
  "devDependencies": {
    "tailwindcss": "latest",
    "typescript": "latest",
    "@types/node": "latest",
    "@types/react": "latest"
  }
}
```

## Open Questions for Research

1. **fxtwitter reliability**: Is fxtwitter.com still working? What's the HTML structure? Are there rate limits?

2. **vxtwitter as backup**: Does vxtwitter.com work the same way? Which is more reliable?

3. **Thread support**: How do these services handle Twitter threads? Is it automatic or do we need to fetch each tweet?

4. **Rate limiting**: Do any of these services rate limit? Should we add delays or caching?

5. **Alternative mirrors**: Are there other Twitter mirror services that might work?

6. **Nitter status**: Is Nitter still operational anywhere? Could be another fallback.

## Out of Scope (for MVP)

- User accounts / authentication
- Saving/bookmarking extracted content
- Batch URL processing
- Browser extension version
- PDF extraction
- Image OCR
- Video transcription

## Notes for Implementing Agent

- Start by researching and verifying the fxtwitter/vxtwitter approach before building
- Test the mirror services manually first to understand their HTML structure
- Prioritize article extraction (more reliable) over Twitter
- Keep the UI simple - this is a utility tool, not a product
- Add good error messages so users know what went wrong
- Consider adding a "Report Issue" link for failed URLs
