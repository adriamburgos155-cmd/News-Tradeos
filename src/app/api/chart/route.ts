import { NextResponse } from 'next/server'
import type { OHLCV } from '@/lib/types'

const FH_KEY = process.env.FINNHUB_KEY || ''

// Finnhub candles — near real-time
async function finnhubCandles(symbol: string, days = 30): Promise<OHLCV[] | null> {
  if (!FH_KEY) return null
  try {
    const to   = Math.floor(Date.now() / 1000)
    const from = to - days * 24 * 3600
    const r = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FH_KEY}`,
      { next: { revalidate: 300 } }
    )
    if (!r.ok) return null
    const j = await r.json()
    if (j.s !== 'ok' || !j.t?.length) return null
    return j.t.map((ts: number, i: number) => ({
      time:   new Date(ts * 1000).toISOString().split('T')[0],
      open:   j.o[i],
      high:   j.h[i],
      low:    j.l[i],
      close:  j.c[i],
      volume: j.v[i],
    }))
  } catch { return null }
}

// Yahoo fallback
async function yahooCandles(symbol: string): Promise<OHLCV[] | null> {
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`,
      { next: { revalidate: 300 }, headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    if (!r.ok) return null
    const j   = await r.json()
    const res = j?.chart?.result?.[0]
    if (!res)  return null
    const ts: number[] = res.timestamp ?? []
    const q = res.indicators?.quote?.[0]
    return ts
      .map((t, i) => ({
        time:   new Date(t * 1000).toISOString().split('T')[0],
        open:   q?.open?.[i]   ?? 0,
        high:   q?.high?.[i]   ?? 0,
        low:    q?.low?.[i]    ?? 0,
        close:  q?.close?.[i]  ?? 0,
        volume: q?.volume?.[i] ?? 0,
      }))
      .filter(d => d.close > 0)
  } catch { return null }
}

// Symbol maps
const FH_MAP: Record<string, string> = {
  SPY:    'SPY',
  QQQ:    'QQQ',
  XAUUSD: 'GLD',
  USO:    'USO',
  DXY:    'UUP',   // DXY ETF proxy
  BTC:    'COIN',  // Coinbase proxy (BTC crypto not available on basic Finnhub)
}

const YH_MAP: Record<string, string> = {
  SPY:    '^GSPC',
  QQQ:    '^NDX',
  XAUUSD: 'GC=F',
  USO:    'CL=F',
  DXY:    'DX-Y.NYB',
  BTC:    'BTC-USD',
}

export async function GET(req: Request) {
  const sym    = new URL(req.url).searchParams.get('symbol') || 'SPY'
  const fhSym  = FH_MAP[sym] ?? sym
  const yhSym  = YH_MAP[sym] ?? sym

  // Try Finnhub first
  let data: OHLCV[] | null = null
  if (FH_KEY) {
    data = await finnhubCandles(fhSym)
  }
  // Fallback to Yahoo
  if (!data || data.length === 0) {
    data = await yahooCandles(yhSym)
  }

  return NextResponse.json({
    data:      data ?? [],
    symbol:    sym,
    mock:      !data || data.length === 0,
    source:    FH_KEY && data ? 'finnhub' : 'yahoo',
    updatedAt: new Date().toISOString(),
  })
}
