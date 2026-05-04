'use client'
import type { SectorPerf, EarningsEntry } from '@/lib/types'
import { MOCK_SECTORS, MOCK_EARNINGS } from '@/lib/market-data'
import { clsx } from 'clsx'

function HeatCell({ name, value, size = 'md' }: { name: string; value: number; size?: 'sm'|'md'|'lg' }) {
  const abs = Math.abs(value)
  const intensity = Math.min(abs / 4, 1)
  const bg = value >= 0
    ? `rgba(78,222,163,${0.08 + intensity * 0.25})`
    : `rgba(255,84,81,${0.08 + intensity * 0.25})`
  const border = value >= 0 ? 'rgba(78,222,163,0.3)' : 'rgba(255,84,81,0.3)'
  const textCol = value >= 0 ? '#4edea3' : '#ff5451'

  return (
    <div style={{ background: bg, borderColor: border }} className={clsx(
      'border flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition-opacity',
      size === 'lg' ? 'p-4 min-h-[80px]' : size === 'md' ? 'p-3 min-h-[64px]' : 'p-2 min-h-[48px]'
    )}>
      <span className="font-sans text-[10px] text-on-surface-variant mb-1 text-center leading-tight">{name}</span>
      <span style={{ color: textCol }} className="font-mono text-[13px] font-bold">
        {value >= 0 ? '+' : ''}{value.toFixed(2)}%
      </span>
    </div>
  )
}

function EarningsRow({ e }: { e: EarningsEntry }) {
  const statusColor: Record<string,string> = {
    beat:'text-secondary', miss:'text-tertiary', today:'text-warn', upcoming:'text-outline', inline:'text-on-surface-variant'
  }
  const statusBg: Record<string,string> = {
    beat:'bg-secondary/10 border-secondary/30', miss:'bg-tertiary/10 border-tertiary/30',
    today:'bg-warn/10 border-warn/30', upcoming:'bg-outline/10 border-outline/30', inline:'bg-surface-container border-outline-variant'
  }
  return (
    <tr className="border-b border-outline-variant/30 terminal-row">
      <td className="px-3 py-2">
        <span className="font-mono text-[11px] font-bold text-primary">{e.symbol}</span>
        <div className="font-sans text-[9px] text-outline truncate max-w-[100px]">{e.company}</div>
      </td>
      <td className="px-3 py-2 font-mono text-[10px] text-on-surface-variant">{e.date.slice(5)}</td>
      <td className="px-3 py-2 text-right font-mono text-[10px] text-on-surface-variant">
        {e.epsEst !== null ? `$${e.epsEst.toFixed(2)}` : '—'}
      </td>
      <td className="px-3 py-2 text-right font-mono text-[10px]">
        {e.epsActual !== null
          ? <span className={e.epsActual >= (e.epsEst ?? 0) ? 'text-secondary font-bold' : 'text-tertiary font-bold'}>${e.epsActual.toFixed(2)}</span>
          : <span className="text-outline">—</span>
        }
      </td>
      <td className="px-3 py-2 text-right font-mono text-[10px]">
        {e.surprise !== undefined
          ? <span className={e.surprise >= 0 ? 'text-secondary' : 'text-tertiary'}>{e.surprise >= 0 ? '+' : ''}{e.surprise.toFixed(1)}%</span>
          : <span className="text-outline">—</span>
        }
      </td>
      <td className="px-3 py-2">
        <span className={clsx('font-mono text-[8px] font-bold uppercase border px-1.5 py-0.5', statusBg[e.status], statusColor[e.status])}>
          {e.status}
        </span>
      </td>
    </tr>
  )
}

export function HeatmapView() {
  const sectors  = MOCK_SECTORS
  const earnings = MOCK_EARNINGS
  const sorted   = [...sectors].sort((a,b) => b.change - a.change)
  const today    = earnings.filter(e => e.status === 'today')
  const beat     = earnings.filter(e => e.status === 'beat')

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      <div className="flex items-center gap-3 shrink-0">
        <span className="material-symbols-outlined text-primary text-[20px]">grid_view</span>
        <div>
          <div className="font-sans font-bold text-headline-sm text-on-surface">Market Heatmap</div>
          <div className="font-mono text-label-xs text-outline">S&P 500 Sectors · Earnings Season Q1 2026</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Sector heatmap grid */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3">
          <div className="font-mono text-label-xs text-outline uppercase mb-3 flex items-center justify-between">
            S&P 500 Sectors — Today
            <span className="text-secondary">{sorted.filter(s=>s.change>0).length} ↑ &nbsp; {sorted.filter(s=>s.change<0).length} ↓</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-1">
            {sorted.map(s => <HeatCell key={s.name} name={s.name} value={s.change} />)}
          </div>
        </div>

        {/* YTD row */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3">
          <div className="font-mono text-label-xs text-outline uppercase mb-3">Year-To-Date Performance</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-1">
            {[...sectors].sort((a,b) => b.ytd - a.ytd).map(s => <HeatCell key={s.name} name={s.name} value={s.ytd} size="sm" />)}
          </div>
        </div>

        {/* Earnings table */}
        <div className="bg-surface-container-lowest border border-outline-variant">
          <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant">
            <span className="font-mono text-label-xs text-outline uppercase">Earnings Season · Q1 2026</span>
            <div className="flex gap-2 font-mono text-[9px]">
              <span className="text-warn">{today.length} Today</span>
              <span className="text-outline">·</span>
              <span className="text-secondary">{beat.length} Beat</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant font-mono text-[9px] text-outline uppercase">
                  <th className="px-3 py-1.5 text-left">Symbol</th>
                  <th className="px-3 py-1.5 text-left">Date</th>
                  <th className="px-3 py-1.5 text-right">Est</th>
                  <th className="px-3 py-1.5 text-right">Act</th>
                  <th className="px-3 py-1.5 text-right">Surp</th>
                  <th className="px-3 py-1.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map(e => <EarningsRow key={e.symbol} e={e} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
