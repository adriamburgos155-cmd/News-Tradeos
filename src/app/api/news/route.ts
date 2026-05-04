import { NextResponse } from 'next/server'
import { MOCK_NEWS } from '@/lib/market-data'

const FH_KEY  = process.env.FINNHUB_KEY  || ''
const NEWS_KEY = process.env.NEWS_API_KEY || ''

function detectCat(t: string): 'earnings'|'macro'|'geopolitics'|'energy'|'general'|'fed' {
  const tx = t.toLowerCase()
  if (tx.includes('fed ')||tx.includes('fomc')||tx.includes('powell')||tx.includes('federal reserve')) return 'fed'
  if (tx.includes('earn')||tx.includes('eps')||tx.includes('revenue')||tx.includes('quarter'))           return 'earnings'
  if (tx.includes('iran')||tx.includes('war')||tx.includes('sanction'))                                  return 'geopolitics'
  if (tx.includes('oil')||tx.includes('crude')||tx.includes('opec'))                                     return 'energy'
  if (tx.includes('inflation')||tx.includes('gdp')||tx.includes('cpi')||tx.includes('pce'))              return 'macro'
  return 'general'
}
function detectSent(t: string): 'positive'|'negative'|'neutral' {
  const pos=['beat','surge','rally','gain','rise','record','strong','exceed'], neg=['fall','drop','slump','miss','decline','war','crisis','risk']
  const tx=t.toLowerCase(); const p=pos.filter(w=>tx.includes(w)).length, n=neg.filter(w=>tx.includes(w)).length
  return p>n?'positive':n>p?'negative':'neutral'
}

export async function GET() {
  if (FH_KEY) {
    try {
      const r = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FH_KEY}`,{next:{revalidate:120}})
      if (r.ok) {
        const j = await r.json()
        if (Array.isArray(j) && j.length) {
          const items = j.slice(0,12).map((a:{id:number;headline:string;summary:string;source:string;url:string;datetime:number}) => ({
            id:String(a.id), headline:a.headline, summary:a.summary, source:a.source, url:a.url,
            publishedAt:new Date(a.datetime*1000).toISOString(),
            category:detectCat(a.headline), sentiment:detectSent(a.headline), tickers:[]
          }))
          return NextResponse.json({ data:items, mock:false, updatedAt:new Date().toISOString() })
        }
      }
    } catch { /**/ }
  }
  return NextResponse.json({ data:MOCK_NEWS, mock:true, updatedAt:new Date().toISOString() })
}
