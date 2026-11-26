# GigaSpeed - Implementation Plan

## Features

### 1. Ping Test (Prompt 2)
- Create `lib/speedtest.ts` with `measurePing()` function
- Fetch `https://speed.cloudflare.com/__down?bytes=0` 5 times
- Calculate min time = ping (ms), average difference = jitter (ms)
- Throw error on fetch failure
- START button triggers ping, shows result in Ping card
- Status line: "Ping measure ho raha hai..."
- Download/Upload cards show "—"

### 2. Download Test (Prompt 3)
- Add `measureDownload(onProgress)` to `lib/speedtest.ts`
- Stream `https://speed.cloudflare.com/__down?bytes=25000000`
- Report live Mbps via `onProgress` every 200ms
- Repeat fetch if completes < 2s, minimum 5s total for accuracy
- Final Mbps = total bytes / total time
- Gauge shows live speed, graph draws live line
- Download card shows final Mbps

### 3. Upload Test (Prompt 4)
- Add `measureUpload(onProgress)` to `lib/speedtest.ts`
- Generate 5MB random data via `crypto.getRandomValues`
- POST to `https://speed.cloudflare.com/__up` using XMLHttpRequest
- Use `xhr.upload.onprogress` for live progress (fetch doesn't provide upload progress)
- Minimum 5s upload duration (repeat if needed)
- Final Mbps = total bytes / total time
- Gauge shows live upload speed, Upload card shows final Mbps

### 4. Full Test Flow (Prompt 5)
- Chain Ping → Download → Upload sequentially on START
- Status line + gauge show step: "Step 1/3: Ping...", "Step 2/3: Download...", "Step 3/3: Upload..."
- START button disabled during test, shows "Testing..."
- After completion, button shows "Dobara Test Karo"
- All 3 cards show final numbers
- On any step failure: stop, show error in that card with "Try again", never fake numbers

### 5. Result Summary + History (Prompt 6)
- Show summary: "Download X Mbps • Upload Y Mbps • Ping Z ms"
- Rating: 100+ Mbps = "Bahut tez", 25-100 = "Achhi", <25 = "Slow"
- Save each test to localStorage (date/time, last 5 results)
- Display "Pichle Tests" list
- "History saaf karo" button

### 6. Error Handling + Mobile Polish (Prompt 7)
- Network error: "Internet se connect nahi ho pa raha. Wi-Fi/data check karke dobara try karo." + Retry button
- Mid-test failure: same error, don't use partial numbers
- Mobile: gauge, button, cards fit small screens cleanly
- Fix all TypeScript/ESLint warnings

### 7. Vercel Deploy (Prompt 8)
- Create GitHub repo "gigaspeed", push project
- Create Vercel project, connect GitHub repo, deploy
- No environment variables needed
- Test live link: verify ping/download/upload numbers work