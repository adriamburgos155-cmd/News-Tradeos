import { NextResponse } from 'next/server'
import { MOCK_MARKET } from '@/lib/market-data'
import type { MarketSummary, Quote } from '@/lib/types'

async function yahooQuote(symbol: string): Promise<Partial<Quote>|null> {
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      { next:{revalidate:30}, headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'} }
    )
    if (!r.ok) return null
    const j = await r.json()
    const meta = j?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price = meta.regularMarketPrice ?? meta.previousClose
    const prev  = meta.chartPreviousClose ?? meta.previousClose
    return { price, change:price-prev, changePct:prev?((price-prev)/prev)*100:0, open:meta.regularMarketOpen??price, high:meta.regularMarketDayHigh??price, low:meta.regularMarketDayLow??price, volume:meta.regularMarketVolume??0, updatedAt:new Date().toISOString() }
  } catch { return null }
}

const SYM: Record<string,string> = {
  sp500:'^GSPC', nasdaq:'^NDX', dji:'^DJI', vix:'^VIX',
  xauusd:'GC=F', dxy:'DX-Y.NYB', oil:'CL=F', btcusd:'BTC-USD',
  eurusd:'EURUSD=X', gbpusd:'GBPUSD=X', usdjpy:'USDJPY=X'
}

export async function GET() {
  try {
    const keys = Object.keys(SYM)
    const results = await Promise.allSettled(keys.map(k => yahooQuote(SYM[k])))
    const live: Record<string,Partial<Quote>|null> = {}
    keys.forEach((k,i) => { const r=results[i]; live[k]=r.status==='fulfilled'?r.value:null })
    const m = MOCK_MARKET
    const merge = (mock: Quote, k: string): Quote => live[k] ? { ...mock,...live[k] } : mock
    const market: MarketSummary = {
      sp500:merge(m.sp500,'sp500'), nasdaq:merge(m.nasdaq,'nasdaq'), dji:merge(m.dji,'dji'),
      vix:merge(m.vix,'vix'), xauusd:merge(m.xauusd,'xauusd'), dxy:merge(m.dxy,'dxy'),
      oil:merge(m.oil,'oil'), btcusd:merge(m.btcusd,'btcusd'),
      eurusd:{...m.eurusd,rate:live.eurusd?.price??m.eurusd.rate,change:live.eurusd?.change??m.eurusd.change,changePct:live.eurusd?.changePct??m.eurusd.changePct},
      gbpusd:{...m.gbpusd,rate:live.gbpusd?.price??m.gbpusd.rate,change:live.gbpusd?.change??m.gbpusd.change,changePct:live.gbpusd?.changePct??m.gbpusd.changePct},
      usdjpy:{...m.usdjpy,rate:live.usdjpy?.price??m.usdjpy.rate,change:live.usdjpy?.change??m.usdjpy.change,changePct:live.usdjpy?.changePct??m.usdjpy.changePct},
    }
    return NextResponse.json({ data:market, mock:!Object.values(live).some(Boolean), updatedAt:new Date().toISOString() })
  } catch { return NextResponse.json({ data:MOCK_MARKET, mock:true, updatedAt:new Date().toISOString() }) }
}
