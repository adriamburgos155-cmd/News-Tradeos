'use client'
import useSWR from 'swr'
import type { MarketSummary, NewsItem, OHLCV, CalendarEvent, FredDollarAnalysis } from '@/lib/types'

// Pass Finnhub key from localStorage as header for real-time data
const fetcherWithKey = async (url: string) => {
  const fhKey = typeof window !== 'undefined' ? localStorage.getItem('gi_fh_key') || '' : ''
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (fhKey) headers['x-fh-key'] = fhKey
  const r = await fetch(url, { headers })
  return r.json()
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useMarket(): {
  market:    MarketSummary | null
  isMock:    boolean
  source:    string
  isLoading: boolean
  error:     unknown
  refresh:   () => void
  updatedAt: string | null
} {
  const { data, error, isLoading, mutate } = useSWR('/api/market', fetcherWithKey, {
    refreshInterval:   15000,  // 15s with Finnhub
    revalidateOnFocus: true,
    dedupingInterval:  8000,
  })
  return {
    market:    (data?.data as MarketSummary) ?? null,
    isMock:    data?.mock    ?? false,
    source:    data?.source  ?? 'unknown',
    isLoading,
    error,
    refresh:   mutate,
    updatedAt: data?.updatedAt ?? null,
  }
}

export function useNews(): { news: NewsItem[]; isMock: boolean; source: string; isLoading: boolean } {
  const { data, isLoading } = useSWR('/api/news', fetcherWithKey, {
    refreshInterval: 60000,   // 1min with Finnhub
    dedupingInterval: 30000,
  })
  return {
    news:   (data?.data as NewsItem[]) ?? [],
    isMock: data?.mock   ?? false,
    source: data?.source ?? 'unknown',
    isLoading,
  }
}

export function useChart(symbol: string): { ohlcv: OHLCV[]; isMock: boolean; source: string; isLoading: boolean } {
  const { data, isLoading } = useSWR(`/api/chart?symbol=${symbol}`, fetcherWithKey, {
    refreshInterval: 60000,
    dedupingInterval: 30000,
  })
  return {
    ohlcv:  (data?.data as OHLCV[]) ?? [],
    isMock: data?.mock   ?? false,
    source: data?.source ?? 'unknown',
    isLoading,
  }
}

export function useCalendar(): { events: CalendarEvent[]; source: string; isLoading: boolean } {
  const { data, isLoading } = useSWR('/api/calendar', fetcher, { refreshInterval: 1800000 })
  return {
    events: (data?.data as CalendarEvent[]) ?? [],
    source: data?.source ?? 'fallback',
    isLoading,
  }
}

export function useFred(): {
  fred:      FredDollarAnalysis | null
  isMock:    boolean
  isLoading: boolean
  refresh:   () => void
} {
  const { data, isLoading, mutate } = useSWR('/api/fred', fetcher, {
    refreshInterval:   3600000,
    revalidateOnFocus: false,
  })
  return {
    fred:     (data?.data as FredDollarAnalysis) ?? null,
    isMock:   data?.mock ?? false,
    isLoading,
    refresh:  mutate,
  }
}
