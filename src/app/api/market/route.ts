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
      price:     j.c,
      change:    j.d  ?? 0,
      changePct: j.dp ?? 0,
      open:      j.o  ?? j.c,
      high:      j.h  ?? j.c,
      low:       j.l  ?? j.c,
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
    const j    = await r.json()
    const meta = j?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price = meta.regularMarketPrice ?? meta.previousClose
    const prev  = meta.chartPreviousClose ?? meta.previousClose
    return {
      price,
      change:    price - prev,
      changePct: prev ? ((price - prev) / prev) * 100 : 0,
      open:      meta.regularMarketOpen    ?? price,
      high:      meta.regularMarketDayHigh ?? price,
      low:       meta.regularMarketDayLow  ?? price,
      volume:    meta.regularMarketVolume  ?? 0,
      updatedAt: new Date().toISOString(),
    }
  } catch { return null }
}

// Finnhub symbols
const FH: Record<string, string> = {
  sp500:  'SPY', nasdaq:'QQQ', dji:'DIA',
  xauusd: 'GLD', oil:'USO',
  btcusd: 'BINANCE:BTCUSDT',
  eurusd: 'OANDA:EUR_USD',
  gbpusd: 'OANDA:GBP_USD',
  usdjpy: 'OANDA:USD_JPY',
}

// Yahoo symbols
const YH: Record<string, string> = {
  sp500:  '^GSPC', nasdaq:'^NDX', dji:'^DJI', vix:'^VIX',
  xauusd: 'GC=F',  dxy:'DX-Y.NYB', oil:'CL=F',
  btcusd: 'BTC-USD',
  eurusd: 'EURUSD=X', gbpusd:'GBPUSD=X', usdjpy:'USDJPY=X',
}

export async function GET(req: Request) {
  // Accept client-side Finnhub key via header
  const clientFH = req.headers.get('x-fh-key') || ''
  const key      = FH_KEY || clientFH

  try {
    const keys    = Object.keys(YH)
    const results = await Promise.allSettled(
      keys.map(async k => {
        // Try Finnhub first (faster)
        if (key && FH[k]) {
          const fh = await finnhubQuote(FH[k], key)
          if (fh) return { key: k, data: fh, src: 'finnhub' }
        }
        // Fallback Yahoo
        const yh = await yahooQuote(YH[k])
        return { key: k, data: yh, src: 'yahoo' }
      })
    )

    const live: Record<string, Partial<Quote> | null> = {}
    let   src = 'yahoo'
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value) {
        live[r.value.key] = r.value.data
        if (r.value.src === 'finnhub') src = 'finnhub'
      }
    })

    const m     = MOCK_MARKET
    const merge = (mock: Quote, k: string): Quote =>
      live[k] ? { ...mock, ...live[k] } : mock

    const market: MarketSummary = {
      sp500:  merge(m.sp500,  'sp500'),
      nasdaq: merge(m.nasdaq, 'nasdaq'),
      dji:    merge(m.dji,    'dji'),
      vix:    merge(m.vix,    'vix'),
      xauusd: merge(m.xauusd, 'xauusd'),
      dxy:    merge(m.dxy,    'dxy'),
      oil:    merge(m.oil,    'oil'),
      btcusd: merge(m.btcusd, 'btcusd'),
      eurusd: { ...m.eurusd, rate:live.eurusd?.price??m.eurusd.rate, change:live.eurusd?.change??m.eurusd.change, changePct:live.eurusd?.changePct??m.eurusd.changePct },
      gbpusd: { ...m.gbpusd, rate:live.gbpusd?.price??m.gbpusd.rate, change:live.gbpusd?.change??m.gbpusd.change, changePct:live.gbpusd?.changePct??m.gbpusd.changePct },
      usdjpy: { ...m.usdjpy, rate:live.usdjpy?.price??m.usdjpy.rate, change:live.usdjpy?.change??m.usdjpy.change, changePct:live.usdjpy?.changePct??m.usdjpy.changePct },
    }

    return NextResponse.json({
      data:      market,
      mock:      !Object.values(live).some(Boolean),
      source:    src,
      updatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ data: MOCK_MARKET, mock: true, source: 'fallback', updatedAt: new Date().toISOString() })
  }
}
