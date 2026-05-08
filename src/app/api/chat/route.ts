import { NextResponse } from 'next/server'

const SYSTEM = `You are GlobalInsight Terminal AI — an institutional-grade financial analyst with access to live market data AND Federal Reserve (FRED) macroeconomic data.

Your specialty is USD analysis: correlating Fed policy, CPI/PCE inflation, Treasury yields, M2 money supply, and GDP with movements in DXY, EUR/USD, Gold, and risk assets.

Rules:
- Respond in the same language the user writes (Spanish or English)
- Reference specific numbers from the provided context
- Use **bold** for key figures
- For summaries: 📈 bullish, 📉 bearish, ⚠️ risk, 💡 opportunity
- Max 5 sentences unless deep analysis is requested
- When discussing USD: always mention Fed rate, CPI trend, and yield spread context
- Terminal tone: clinical, precise, no fluff`

export async function POST(req: Request) {
  try {
    const { messages, marketContext, fredContext, apiKey } = await req.json()
    const GROQ_KEY = process.env.GROQ_API_KEY || apiKey || ''
    if (!GROQ_KEY) return NextResponse.json({ error:'NO_KEY', message:'Add your Groq API key in Settings.' }, { status:401 })

    const m = marketContext
    const f = fredContext

    const ctx = `
LIVE MARKET DATA (${new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York'})} EST):
DXY: ${m?.dxy?.price?.toFixed(2)} (${m?.dxy?.changePct>=0?'+':''}${m?.dxy?.changePct?.toFixed(2)}%) | EUR/USD: ${m?.eurusd?.rate} | GBP/USD: ${m?.gbpusd?.rate} | USD/JPY: ${m?.usdjpy?.rate}
S&P 500: ${m?.sp500?.price} (${m?.sp500?.changePct>=0?'+':''}${m?.sp500?.changePct?.toFixed(2)}%) | NASDAQ: ${m?.nasdaq?.price} (${m?.nasdaq?.changePct>=0?'+':''}${m?.nasdaq?.changePct?.toFixed(2)}%)
Gold XAU/USD: $${m?.xauusd?.price} (${m?.xauusd?.changePct>=0?'+':''}${m?.xauusd?.changePct?.toFixed(2)}%) | WTI Oil: $${m?.oil?.price} | BTC: $${m?.btcusd?.price?.toLocaleString()}
VIX: ${m?.vix?.price} (${m?.vix?.changePct>=0?'+':''}${m?.vix?.changePct?.toFixed(2)}%)

FRED MACRO DATA (Federal Reserve Economic Data):
Fed Funds Rate: ${f?.fedFunds?.observations?.slice(-1)[0]?.value ?? '4.33'}%
CPI YoY: ~${f?.cpi?.observations?.slice(-1)[0]?.value ?? '315'}  | Core CPI: ~${f?.coreCpi?.observations?.slice(-1)[0]?.value ?? '326'}
10Y Treasury: ${f?.t10y?.observations?.slice(-1)[0]?.value ?? '4.38'}% | 2Y Treasury: ${f?.t2y?.observations?.slice(-1)[0]?.value ?? '3.82'}%
Yield Spread (10Y-2Y): ${f?.yield_spread?.observations?.slice(-1)[0]?.value ?? '0.56'}% (${(f?.yield_spread?.observations?.slice(-1)[0]?.value ?? 0.56) > 0 ? 'normal curve' : 'inverted'})
M2 Money Supply: $${f?.m2?.observations?.slice(-1)[0]?.value ?? '21200'}B
Unemployment: ${f?.unemployment?.observations?.slice(-1)[0]?.value ?? '4.2'}%
PCE Price Index: ${f?.pce?.observations?.slice(-1)[0]?.value ?? '126.4'}

Today May 3, 2026: AAPL & AMZN earnings tonight | Jobs Report out today | Fed held rates at 4.25-4.50% yesterday`

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ_KEY}`},
      body:JSON.stringify({
        model:'llama-3.3-70b-versatile',
        max_tokens:1024,
        temperature:0.6,
        messages:[
          { role:'system', content: SYSTEM + '\n\n' + ctx },
          ...messages.map((msg: {role:string;content:string}) => ({ role:msg.role, content:msg.content }))
        ]
      })
    })

    if (!resp.ok) {
      const e = await resp.text()
      if (resp.status===401) return NextResponse.json({ error:'INVALID_KEY', message:'Invalid Groq API key. Check Settings.' }, { status:401 })
      return NextResponse.json({ error:e }, { status:500 })
    }
    const data = await resp.json()
    return NextResponse.json({ reply: data.choices?.[0]?.message?.content || 'No response.' })
  } catch(err) {
    return NextResponse.json({ error:String(err) }, { status:500 })
  }
}
