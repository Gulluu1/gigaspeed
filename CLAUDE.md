# GigaSpeed - Project Rules

## Tech Stack
- Next.js (App Router) + TypeScript strict + Tailwind CSS
- No separate backend - everything runs in browser
- Deploy: Vercel

## Development Rules
- **One feature at a time** - Next feature only after previous step's build passes
- **Never fake/random speed numbers** - If measurement fails, show error message
- **TypeScript strict** - No `any` type usage
- **Run `npm run build` after every change** - Build pass is proof of step completion
- **Keep replies short** - 2-3 line summary + files changed, then STOP

## Measurement Logic (Real Data Only)
- **Ping**: `https://speed.cloudflare.com/__down?bytes=0` - 5 requests, min time = ping, avg diff = jitter
- **Download**: `https://speed.cloudflare.com/__down?bytes=25000000` - stream read, bytes/time = Mbps
- **Upload**: `https://speed.cloudflare.com/__up` - POST random data, XMLHttpRequest for progress
- All endpoints support CORS for browser direct use

## Design
- Background: soft gradient (indigo-50 to fuchsia-50)
- Header: "GigaSpeed" gradient text + subtitle
- Center: large circular gauge (0-1000 Mbps) with big speed number
- START button: large, gradient (violet to fuchsia), rounded-full
- 3 result cards: Download (sky blue), Upload (emerald green), Ping (amber)
- Mobile: single column, Desktop: cards in row
- Live step indicator during test