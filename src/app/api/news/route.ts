import { NextResponse } from 'next/server'
import { MOCK_NEWS } from '@/lib/market-data'
import type { NewsItem } from '@/lib/types'

const FH_KEY = process.env.FINNHUB_KEY || ''

function detectCat(t: string): NewsItem['category'] {
  const tx = t.toLowerCase()
  if (tx.includes('fed ')||tx.includes('fomc')||tx.includes('powell')||tx.includes('federal reserve')) return 'fed'
  if (tx.includes('earn')||tx.includes('eps')||tx.includes('revenue')||tx.includes('quarter'))         return 'earnings'
  if (tx.includes('iran')||tx.includes('war')||tx.includes('sanction')||tx.includes('geopolit'))       return 'geopolitics'
  if (tx.includes('oil')||tx.includes('crude')||tx.includes('opec')||tx.includes('energy'))            return 'energy'
  if (tx.includes('inflation')||tx.includes('gdp')||tx.includes('cpi')||tx.includes('pce'))            return 'macro'
  return 'general'
}

function detectSent(t: string): NewsItem['sentiment'] {
  const pos = ['beat','surge','rally','gain','rise','record','strong','exceed','boost','top']
  const neg = ['fall','drop','slump','miss','decline','war','crisis','risk','loss','weak','cut']
  const tx  = t.toLowerCase()
  const p   = pos.filter(w => tx.includes(w)).length
  const n   = neg.filter(w => tx.includes(w)).length
  return p > n ? 'positive' : n > p ? 'negative' : 'neutral'
}

function extractTickers(t: string): string[] {
  const known = ['META','GOOGL','AMZN','MSFT','AAPL','NVDA','TSLA','SPY','QQQ','TXN','ISRG','BK','JNJ','XOM','CVX','GS','JPM']
  return known.filter(sym => t.toUpperCase().includes(sym))
}

export async function GET() {
  if (FH_KEY) {
    try {
      // Fetch general + forex news from Finnhub
      const [generalRes, forexRes] = await Promise.allSettled([
        fetch(`https://finnhub.io/api/v1/news?category=general&token=${FH_KEY}`, { next: { revalidate: 60 } }),
        fetch(`https://finnhub.io/api/v1/news?category=forex&token=${FH_KEY}`,   { next: { revalidate: 60 } }),
      ])

      const items: NewsItem[] = []

      for (const res of [generalRes, forexRes]) {
        if (res.status === 'fulfilled' && res.value.ok) {
          const j = await res.value.json()
          if (Array.isArray(j)) {
            j.slice(0, 8).forEach((a: { id: number; headline: string; summary: string; source: string; url: string; datetime: number }) => {
              if (!a.headline) return
              items.push({
                id:          String(a.id),
                headline:    a.headline,
                summary:     a.summary || '',
                source:      a.source  || 'Finnhub',
                url:         a.url     || '#',
                publishedAt: new Date(a.datetime * 1000).toISOString(),
                category:    detectCat(a.headline + ' ' + (a.summary || '')),
                sentiment:   detectSent(a.headline),
                tickers:     extractTickers(a.headline),
              })
            })
          }
        }
      }

      // Deduplicate by headline
      const seen = new Set<string>()
      const unique = items.filter(i => {
        if (seen.has(i.headline)) return false
        seen.add(i.headline)
        return true
      })

      if (unique.length > 0) {
        // Sort by newest first
        unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        return NextResponse.json({ data: unique.slice(0, 14), mock: false, source: 'finnhub', updatedAt: new Date().toISOString() })
      }
    } catch { /* fallback */ }
  }

  return NextResponse.json({ data: MOCK_NEWS, mock: true, source: 'fallback', updatedAt: new Date().toISOString() })
}
