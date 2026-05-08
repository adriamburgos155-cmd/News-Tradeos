import { NextResponse } from 'next/server'
import { MOCK_MARKET } from '@/lib/market-data'
import type { MarketSummary, Quote } from '@/lib/types'

const FH_KEY = process.env.FINNHUB_KEY || ''

async function finnhubQuote(symbol: string, key: string): Promise<Partial<Quote> | null> {
  try {
    const r = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`,
      { next: { revalidate: 15 }, headers: { 'Accept': 'application/json' } }
    )
    if (!r.ok) return null
    const j = await r.json()
    if (!j.c || j.c === 0) return null
    return {
      price: j.c, change: j.d ?? 0, changePct: j.dp ?? 0,
      open: j.o ?? j.c, high: j.h ?? j.c, low: j.l ?? j.c,
      updatedAt: new Date().toISOString(),
    }
  } catch { return null }
}

async function yahooQuote(symbol: string): Promise<Partial<Quote> | null> {
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      { next: { revalidate: 30 }, headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    if (!r.ok) return null
    const j = await r.json()
    const meta = j?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price = meta.regularMarketPrice ?? meta.previousClose
    const prev  = meta.chartPreviousClose ?? meta.previousClose
    return {
      price, change: price - prev,
      changePct: prev ? ((price - prev) / prev) * 100 : 0,
      open: meta.regularMarketOpen ?? price,
      high: meta.regularMarketDayHigh ?? price,
      low:  meta.regularMarketDayLow  ?? price,
      volume: meta.regularMarketVolume ?? 0,
      updatedAt: new Date().toISOString(),
    }
  } catch { return null }
}

// Real index values from Yahoo (not ETFs)
const YH: Record<string, string> = {
  sp500: '^GSPC', nasdaq: '^NDX', dji: '^DJI', vix: '^VIX',
  xauusd: 'GC=F', dxy: 'DX-Y.NYB', oil: 'CL=F', btcusd: 'BTC-USD',
}

// Forex from Finnhub (faster)
const FH_FOREX: Record<string, string> = {
  eurusd: 'OANDA:EUR_USD', gbpusd: 'OANDA:GBP_USD', usdjpy: 'OANDA:USD_JPY',
}

export async function GET(req: Request) {
  const clientFH = req.headers.get('x-fh-key') || ''
  const key = FH_KEY || clientFH
  try {
    const yhKeys = Object.keys(YH)
    const yhResults = await Promise.allSettled(yhKeys.map(k => yahooQuote(YH[k])))
    const live: Record<string, Partial<Quote> | null> = {}
    yhKeys.forEach((k, i) => {
      const r = yhResults[i]
      live[k] = r.status === 'fulfilled' ? r.value : null
    })
    if (key) {
      const fxKeys = Object.keys(FH_FOREX)
      const fxResults = await Promise.allSettled(fxKeys.map(k => finnhubQuote(FH_FOREX[k], key)))
      fxKeys.forEach((k, i) => {
        const r = fxResults[i]
        if (r.status === 'fulfilled' && r.value) live[k] = r.value
      })
    }
    if (!live.eurusd) {
      const [eu, gb, uj] = await Promise.allSettled([
        yahooQuote('EURUSD=X'), yahooQuote('GBPUSD=X'), yahooQuote('USDJPY=X'),
      ])
      if (eu.status === 'fulfilled') live.eurusd = eu.value
      if (gb.status === 'fulfilled') live.gbpusd = gb.value
      if (uj.status === 'fulfilled') live.usdjpy = uj.value
    }
    const m = MOCK_MARKET
    const merge = (mock: Quote, k: string): Quote => live[k] ? { ...mock, ...live[k] } : mock
    const market: MarketSummary = {
      sp500:  merge(m.sp500,  'sp500'),  nasdaq: merge(m.nasdaq, 'nasdaq'),
      dji:    merge(m.dji,    'dji'),    vix:    merge(m.vix,    'vix'),
      xauusd: merge(m.xauusd, 'xauusd'),dxy:    merge(m.dxy,    'dxy'),
      oil:    merge(m.oil,    'oil'),    btcusd: merge(m.btcusd, 'btcusd'),
      eurusd: { ...m.eurusd, rate: live.eurusd?.price ?? m.eurusd.rate, change: live.eurusd?.change ?? m.eurusd.change, changePct: live.eurusd?.changePct ?? m.eurusd.changePct },
      gbpusd: { ...m.gbpusd, rate: live.gbpusd?.price ?? m.gbpusd.rate, change: live.gbpusd?.change ?? m.gbpusd.change, changePct: live.gbpusd?.changePct ?? m.gbpusd.changePct },
      usdjpy: { ...m.usdjpy, rate: live.usdjpy?.price ?? m.usdjpy.rate, change: live.usdjpy?.change ?? m.usdjpy.change, changePct: live.usdjpy?.changePct ?? m.usdjpy.changePct },
    }
    return NextResponse.json({ data: market, mock: !Object.values(live).some(Boolean), source: key ? 'finnhub+yahoo' : 'yahoo', updatedAt: new Date().toISOString() })
  } catch {
    return NextResponse.json({ data: MOCK_MARKET, mock: true, source: 'fallback', updatedAt: new Date().toISOString() })
  }
}
