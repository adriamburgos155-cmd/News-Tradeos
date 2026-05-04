'use client'
import useSWR from 'swr'
import type { MarketSummary, NewsItem, OHLCV, CalendarEvent, FredDollarAnalysis } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useMarket() {
  const { data, error, isLoading, mutate } = useSWR('/api/market', fetcher, {
    refreshInterval: 30000, revalidateOnFocus: true, dedupingInterval: 10000,
  })
  return { market:(data?.data as MarketSummary)|null, isMock:data?.mock||false, isLoading, error, refresh:mutate, updatedAt:data?.updatedAt||null }
}

export function useNews() {
  const { data, isLoading } = useSWR('/api/news', fetcher, { refreshInterval:120000, dedupingInterval:60000 })
  return { news:(data?.data as NewsItem[])||[], isMock:data?.mock||false, isLoading }
}

export function useChart(symbol: string) {
  const { data, isLoading } = useSWR(`/api/chart?symbol=${symbol}`, fetcher, { refreshInterval:300000 })
  return { ohlcv:(data?.data as OHLCV[])||[], isMock:data?.mock||false, isLoading }
}

export function useCalendar() {
  const { data, isLoading } = useSWR('/api/calendar', fetcher, { refreshInterval:1800000 })
  return { events:(data?.data as CalendarEvent[])||[], source:data?.source||'fallback', isLoading }
}

export function useFred() {
  const { data, isLoading, mutate } = useSWR('/api/fred', fetcher, {
    refreshInterval: 3600000, // hourly
    revalidateOnFocus: false,
  })
  return { fred:(data?.data as FredDollarAnalysis)|null, isMock:data?.mock||false, isLoading, refresh:mutate }
}
