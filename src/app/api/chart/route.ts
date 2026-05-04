import { NextResponse } from 'next/server'

const MAP: Record<string,string> = {
  SPY:'^GSPC', QQQ:'^NDX', XAUUSD:'GC=F', USO:'CL=F', DXY:'DX-Y.NYB', BTC:'BTC-USD'
}

export async function GET(req: Request) {
  const sym = new URL(req.url).searchParams.get('symbol') || 'SPY'
  const yahoo = MAP[sym] ?? sym
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?interval=1d&range=1mo`,
      { next:{revalidate:300}, headers:{'User-Agent':'Mozilla/5.0'} }
    )
    if (!r.ok) return NextResponse.json({ data:[], mock:true })
    const j   = await r.json()
    const res = j?.chart?.result?.[0]
    if (!res)  return NextResponse.json({ data:[], mock:true })
    const ts: number[] = res.timestamp ?? []
    const q = res.indicators?.quote?.[0]
    const data = ts.map((t,i) => ({
      time:   new Date(t*1000).toISOString().split('T')[0],
      open:   q?.open?.[i]   ?? 0,
      high:   q?.high?.[i]   ?? 0,
      low:    q?.low?.[i]    ?? 0,
      close:  q?.close?.[i]  ?? 0,
      volume: q?.volume?.[i] ?? 0,
    })).filter(d => d.close > 0)
    return NextResponse.json({ data, symbol:sym, mock:false, updatedAt:new Date().toISOString() })
  } catch { return NextResponse.json({ data:[], mock:true }) }
}
