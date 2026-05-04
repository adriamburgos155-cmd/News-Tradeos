'use client'
import type { MarketSummary } from '@/lib/types'
import { fmt } from '@/lib/market-data'
import { clsx } from 'clsx'

export function TickerBar({ market }: { market: MarketSummary | null }) {
  const items = market ? [
    { sym:'SPX',    val:fmt(market.sp500.price,0),         pct:market.sp500.changePct },
    { sym:'NDX',    val:fmt(market.nasdaq.price,0),        pct:market.nasdaq.changePct },
    { sym:'DJI',    val:fmt(market.dji.price,0),           pct:market.dji.changePct },
    { sym:'VIX',    val:fmt(market.vix.price,2),           pct:market.vix.changePct },
    { sym:'DXY',    val:fmt(market.dxy.price,3),           pct:market.dxy.changePct },
    { sym:'XAU',    val:'$'+fmt(market.xauusd.price,0),    pct:market.xauusd.changePct },
    { sym:'EUR/USD',val:fmt(market.eurusd.rate,4),         pct:market.eurusd.changePct },
    { sym:'GBP/USD',val:fmt(market.gbpusd.rate,4),         pct:market.gbpusd.changePct },
    { sym:'USD/JPY',val:fmt(market.usdjpy.rate,2),         pct:market.usdjpy.changePct },
    { sym:'WTI',    val:'$'+fmt(market.oil.price,2),       pct:market.oil.changePct },
    { sym:'BTC',    val:'$'+fmt(market.btcusd.price,0),    pct:market.btcusd.changePct },
  ] : [
    { sym:'SPX',val:'—',pct:0 },{ sym:'NDX',val:'—',pct:0 },{ sym:'DXY',val:'—',pct:0 },
    { sym:'XAU',val:'—',pct:0 },{ sym:'WTI',val:'—',pct:0 },
  ]

  const doubled = [...items, ...items]

  return (
    <footer className="fixed bottom-0 left-12 md:left-44 right-0 h-6 bg-surface-container-lowest border-t border-outline-variant flex items-center overflow-hidden z-30">
      <div className="animate-marquee flex items-center gap-8 px-4 cursor-pointer">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5 font-mono text-[9px]">
            <span className="text-outline">{item.sym}</span>
            <span className={clsx('font-bold', item.pct >= 0 ? 'text-secondary' : 'text-tertiary')}>{item.val}</span>
            <span className={clsx(item.pct >= 0 ? 'text-secondary/70' : 'text-tertiary/70')}>
              {item.pct >= 0 ? '+' : ''}{item.pct.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </footer>
  )
}
