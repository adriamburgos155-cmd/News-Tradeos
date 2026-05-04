'use client'
import { useState, useEffect } from 'react'
import type { MarketSummary } from '@/lib/types'
import { fmt } from '@/lib/market-data'
import { clsx } from 'clsx'

interface TopBarProps {
  market: MarketSummary | null
  isMock?: boolean
  onOpenSettings: () => void
}

export function TopBar({ market, isMock, onOpenSettings }: TopBarProps) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setTime(n.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit', timeZone:'America/New_York' }))
      setDate(n.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric', timeZone:'America/New_York' }))
    }
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t)
  }, [])

  const instruments = market ? [
    { label:'DXY',     value:fmt(market.dxy.price,2),      pct:market.dxy.changePct },
    { label:'S&P',     value:fmt(market.sp500.price,0),    pct:market.sp500.changePct },
    { label:'XAU/USD', value:'$'+fmt(market.xauusd.price,0), pct:market.xauusd.changePct },
    { label:'BTC',     value:fmt(market.btcusd.price,0),   pct:market.btcusd.changePct },
  ] : []

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-10 flex items-center justify-between px-3 bg-surface-container-lowest border-b border-outline-variant">
      {/* Left: Logo + key tickers */}
      <div className="flex items-center gap-6">
        <span className="font-sans text-lg font-black tracking-tighter text-on-surface">GLOBALINSIGHT</span>
        <nav className="hidden md:flex items-center gap-4">
          {instruments.map(inst => (
            <div key={inst.label} className="flex items-center gap-1.5">
              <span className={clsx(
                'font-mono text-ticker border-b pb-0.5 cursor-pointer',
                inst.pct >= 0 ? 'text-secondary border-secondary' : 'text-tertiary border-tertiary'
              )}>
                {inst.label}: {inst.value}
              </span>
              <span className={clsx('font-mono text-[9px]', inst.pct >= 0 ? 'text-secondary' : 'text-tertiary')}>
                {inst.pct >= 0 ? '+' : ''}{inst.pct.toFixed(2)}%
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* Right: Status + time */}
      <div className="flex items-center gap-4">
        {isMock && (
          <span className="font-mono text-label-xs text-warn border border-warn/30 px-2 py-0.5">DEMO_DATA</span>
        )}
        <span className="text-secondary border border-secondary/30 px-2 py-0.5 font-mono text-label-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary live-dot" />
          MARKET LIVE
        </span>
        <span className="font-mono text-data-sm text-on-surface-variant hidden lg:block">{time} EST</span>
        <span className="font-mono text-label-xs text-outline hidden lg:block">{date}</span>
        <button onClick={onOpenSettings} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[16px]">settings</span>
        </button>
        <button className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[16px]">notifications_active</span>
        </button>
      </div>
    </header>
  )
}
