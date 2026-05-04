# GlobalInsight Terminal v2

Professional market intelligence terminal with FRED macro analysis, real-time quotes, AI chat, and economic calendar.

## Quick Start

```bash
npm install
cp .env.example .env.local   # add your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
vercel --prod
# Add env vars in Vercel → Settings → Environment Variables
```

## Features

| Feature | Data Source | Key Required |
|---------|-------------|--------------|
| Market quotes (DXY, S&P, Gold, NASDAQ) | Yahoo Finance | ❌ Free |
| Economic Calendar | ForexFactory | ❌ Free |
| AI Chat Analyst | Groq (LLaMA 3.3 70B) | ✅ Free |
| FRED Macro Analysis | St. Louis Fed FRED | ✅ Free |
| News Feed | Finnhub | Optional |

## FRED API Keys

1. **FRED**: [fredaccount.stlouisfed.org/apikeys](https://fredaccount.stlouisfed.org/apikeys) — instant, free
2. **Groq**: [console.groq.com/keys](https://console.groq.com/keys) — instant, free

Or add keys directly in the UI: Settings → API Config (no redeploy needed)

## FRED Indicators Tracked

- `DTWEXBGS` — USD Broad Real Index
- `CPIAUCSL` — CPI All Urban Consumers  
- `CPILFESL` — Core CPI (ex Food & Energy)
- `FEDFUNDS` — Federal Funds Rate
- `DGS10`    — 10-Year Treasury Yield
- `DGS2`     — 2-Year Treasury Yield
- `T10Y2Y`   — Yield Curve (10Y-2Y Spread)
- `M2SL`     — M2 Money Supply
- `UNRATE`   — Unemployment Rate
- `GDP`      — Gross Domestic Product
- `PCEPI`    — PCE Price Index

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (Obsidian terminal design system)
- **Recharts** (area/line charts)
- **SWR** (auto-refresh data fetching)
- **Groq** (LLaMA 3.3 70B ultra-fast inference)
- **FRED API** (Federal Reserve Economic Data)
- **Yahoo Finance** (real-time quotes, no key)
