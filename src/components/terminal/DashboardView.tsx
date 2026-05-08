'use client'
import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { MarketSummary, CalendarEvent, NewsItem, SectorPerf } from '@/lib/types'
import { useChart } from '@/hooks/useMarketData'
import { fmt, timeAgo } from '@/lib/market-data'
import { clsx } from 'clsx'

// ── Instrument card ──────────────────────────────────────
function InstrumentCard({ label, sym, price, pct, change, high, low, sparkData }: {
  label:string; sym:string; price:string; pct:number; change:string
  high?:string; low?:string; sparkData?:number[]
}) {
  const pos = pct >= 0
  const pts = sparkData && sparkData.length > 1
    ? sparkData.map((v,i) => {
        const mn=Math.min(...sparkData),mx=Math.max(...sparkData),rng=mx-mn||1
        const x=(i/(sparkData.length-1))*100,y=20-((v-mn)/rng)*20
        return `${x},${y}`
      }).join(' ')
    : null

  return (
    <div className="bg-surface-container border border-outline-variant p-3 flex flex-col gap-1.5">
      <div className="flex justify-between items-start">
        <span className="font-sans text-label-xs font-bold text-outline uppercase tracking-wider">{label}</span>
        <span className={clsx('font-mono text-data-sm font-bold', pos ? 'text-secondary' : 'text-tertiary')}>
          {pos?'+':''}{pct.toFixed(2)}%
        </span>
      </div>
      <div className="font-mono text-data-lg text-on-surface">{price}</div>
      <div className={clsx('font-mono text-data-sm', pos ? 'text-secondary' : 'text-tertiary')}>
        {pos?'+':''}{change}
      </div>
      {pts && (
        <svg className="w-full" height="20" viewBox="0 0 100 20" preserveAspectRatio="none">
          <polyline fill="none" points={pts} stroke={pos?'#4edea3':'#ff5451'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {(high || low) && (
        <div className="flex gap-3 pt-1 border-t border-outline-variant/50 font-mono text-[9px] text-outline">
          {high && <span>H: <span className="text-on-surface-variant">{high}</span></span>}
          {low  && <span>L: <span className="text-on-surface-variant">{low}</span></span>}
        </div>
      )}
    </div>
  )
}

// ── Sparkline loader per symbol ──────────────────────────
function SparkLoader({ sym, pct }: { sym:string; pct:number }) {
  const { ohlcv } = useChart(sym)
  const closes = ohlcv.slice(-14).map(d => d.close)
  return <InstrumentCard
    label={sym === 'SPY' ? 'S&P 500' : sym === 'QQQ' ? 'NASDAQ 100' : sym === 'XAUUSD' ? 'GOLD XAU/USD' : 'USD INDEX DXY'}
    sym={sym} price="—" pct={pct} change="—" sparkData={closes}
  />
}

// ── Chart area ───────────────────────────────────────────
const CHART_TABS = [
  { label:'S&P 500', sym:'SPY',    fmt:(v:number)=>v.toLocaleString() },
  { label:'Nasdaq',  sym:'QQQ',    fmt:(v:number)=>v.toLocaleString() },
  { label:'Gold',    sym:'XAUUSD', fmt:(v:number)=>'$'+v.toLocaleString() },
  { label:'Oil',     sym:'USO',    fmt:(v:number)=>'$'+v.toFixed(2) },
  { label:'DXY',     sym:'DXY',    fmt:(v:number)=>v.toFixed(3) },
]

function ChartTooltip({ active, payload, formatter }: {active?:boolean;payload?:Array<{value:number;payload:{time:string}}>;formatter:(v:number)=>string}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-container-lowest border border-outline-variant px-2 py-1.5 font-mono text-[10px]">
      <div className="text-outline mb-0.5">{payload[0].payload.time}</div>
      <div className="text-on-surface font-bold">{formatter(payload[0].value)}</div>
    </div>
  )
}

function MainChart() {
  const [active, setActive] = useState(CHART_TABS[0])
  const [range, setRange]   = useState('1M')
  const { ohlcv } = useChart(active.sym)
  const data = ohlcv.map(d => ({ time: d.time.slice(5), value: d.close }))
  const isUp = data.length > 1 && data[data.length-1].value >= data[0].value
  const col  = isUp ? '#4edea3' : '#ff5451'
  const gradId = isUp ? 'gUp' : 'gDn'
  const ranges = ['1D','1W','1M','3M','1Y']

  return (
    <div className="bg-surface-container-lowest border border-outline-variant flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant shrink-0">
        <div className="flex gap-3">
          {CHART_TABS.map(t => (
            <button key={t.sym} onClick={() => setActive(t)}
              className={clsx('font-mono text-label-xs font-bold uppercase transition-colors',
                active.sym===t.sym ? 'text-primary border-b border-primary pb-0.5' : 'text-on-surface-variant hover:text-on-surface'
              )}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px]">
          {ranges.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={clsx('px-1.5 py-0.5 transition-colors',
                range===r ? 'bg-surface-container-highest text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
              )}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-3 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{top:4,right:8,left:0,bottom:0}}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={col} stopOpacity={0.15}/>
                <stop offset="100%" stopColor={col} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="1 4" stroke="#1a1a1a" vertical={false}/>
            <XAxis dataKey="time" tick={{fontSize:9,fontFamily:'JetBrains Mono',fill:'#8c909f'}} tickLine={false} axisLine={{stroke:'#424754'}} interval="preserveStartEnd"/>
            <YAxis tick={{fontSize:9,fontFamily:'JetBrains Mono',fill:'#8c909f'}} tickLine={false} axisLine={false} tickFormatter={active.fmt} width={54} domain={['auto','auto']}/>
            <Tooltip content={<ChartTooltip formatter={active.fmt}/>} cursor={{stroke:'rgba(255,255,255,0.08)',strokeWidth:1}}/>
            <Area type="monotone" dataKey="value" stroke={col} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} activeDot={{r:3,fill:col,strokeWidth:0}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Watchlist ────────────────────────────────────────────
function Watchlist({ market }: { market: MarketSummary | null }) {
  const rows = market ? [
    { sym:'DOW JONES', val:fmt(market.dji.price,0),           pct:market.dji.changePct },
    { sym:'VIX',       val:fmt(market.vix.price,2),           pct:market.vix.changePct },
    { sym:'EUR/USD',   val:fmt(market.eurusd.rate,4),         pct:market.eurusd.changePct },
    { sym:'GBP/USD',   val:fmt(market.gbpusd.rate,4),         pct:market.gbpusd.changePct },
    { sym:'USD/JPY',   val:fmt(market.usdjpy.rate,2),         pct:market.usdjpy.changePct },
    { sym:'WTI OIL',   val:'$'+fmt(market.oil.price,2),       pct:market.oil.changePct },
    { sym:'BITCOIN',   val:'$'+fmt(market.btcusd.price,0),    pct:market.btcusd.changePct },
  ] : []

  return (
    <div className="bg-surface-container-lowest border border-outline-variant flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant bg-surface-container-low/50 shrink-0">
        <span className="font-mono text-label-xs font-bold text-outline uppercase">MARKET_WATCH</span>
        <span className="material-symbols-outlined text-[14px] text-outline">filter_list</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-surface-container-lowest z-10">
            <tr className="font-mono text-[9px] uppercase text-outline border-b border-outline-variant">
              <th className="p-2 text-left font-medium">Symbol</th>
              <th className="p-2 text-right font-medium">Price</th>
              <th className="p-2 text-right font-medium">Chg%</th>
            </tr>
          </thead>
          <tbody className="font-mono text-data-sm">
            {rows.map(r => (
              <tr key={r.sym} className="border-b border-surface-container-highest terminal-row cursor-pointer">
                <td className="p-2 text-on-surface">{r.sym}</td>
                <td className="p-2 text-right text-on-surface-variant">{r.val}</td>
                <td className={clsx('p-2 text-right font-bold', r.pct>=0?'text-secondary':'text-tertiary')}>
                  {r.pct>=0?'+':''}{r.pct.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Calendar mini ────────────────────────────────────────
function CalendarMini({ events }: { events: CalendarEvent[] }) {
  const high = events.filter(e => e.impact==='high').slice(0,5)
  return (
    <div className="bg-surface-container-lowest border border-outline-variant">
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant">
        <span className="font-mono text-label-xs font-bold text-outline uppercase">TODAY_EVENTS</span>
        <span className="font-mono text-[9px] text-tertiary">{high.length} HIGH</span>
      </div>
      <div className="divide-y divide-outline-variant/30">
        {high.map((ev,i) => (
          <div key={i} className="flex items-start gap-2 px-3 py-2 terminal-row">
            <span className="font-mono text-[9px] text-outline w-10 shrink-0 pt-0.5">{ev.time}</span>
            <div className="w-1 h-1 rounded-full bg-tertiary mt-1.5 shrink-0" />
            <div className="min-w-0">
              <div className="font-sans text-[11px] text-on-surface truncate">{ev.event}</div>
              {ev.forecast && (
                <div className="font-mono text-[9px] text-outline">
                  Fcst: <span className="text-primary">{ev.forecast}</span>
                  {ev.previous && <> · Prev: <span className="text-on-surface-variant">{ev.previous}</span></>}
                </div>
              )}
            </div>
          </div>
        ))}
        {high.length === 0 && <div className="px-3 py-3 font-mono text-[10px] text-outline text-center">No high-impact events</div>}
      </div>
    </div>
  )
}

// ── News mini ────────────────────────────────────────────
function NewsMini({ news }: { news: NewsItem[] }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant flex flex-col">
      <div className="px-3 py-2 border-b border-outline-variant">
        <span className="font-mono text-label-xs font-bold text-outline uppercase">MARKET_LIVE</span>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/20">
        {news.slice(0,8).map(n => (
          <div key={n.id} className="px-3 py-2.5 terminal-row cursor-pointer">
            <div className="flex items-center gap-1.5 mb-1">
              <div className={clsx('w-1 h-full self-stretch rounded-sm', n.sentiment==='positive'?'bg-secondary':n.sentiment==='negative'?'bg-tertiary':'bg-outline')} />
              <span className="font-mono text-[9px] text-outline">{timeAgo(n.publishedAt)}</span>
              <span className="font-mono text-[9px] text-primary uppercase">{n.category}</span>
            </div>
            <p className="font-sans text-[11.5px] text-on-surface leading-tight hover:text-primary transition-colors">{n.headline}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Sector heatmap ───────────────────────────────────────
function SectorHeatmap({ sectors }: { sectors: SectorPerf[] }) {
  const sorted = [...sectors].sort((a,b) => b.change - a.change)
  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-3">
      <div className="font-mono text-label-xs font-bold text-outline uppercase mb-3">SECTOR_MOMENTUM</div>
      <div className="space-y-2">
        {sorted.map(s => {
          const pos = s.change >= 0
          const pct = Math.min(Math.abs(s.change) / 3 * 100, 100)
          return (
            <div key={s.name} className="grid grid-cols-[96px_1fr_48px] items-center gap-2">
              <span className="font-mono text-[10px] text-on-surface truncate">{s.name}</span>
              <div className="flex items-center h-3 relative bg-surface-container-low">
                <div className="absolute left-1/2 w-px h-full bg-outline-variant z-10" />
                {pos
                  ? <div className="absolute left-1/2 h-full bg-secondary-container" style={{width:`${pct/2}%`}} />
                  : <div className="absolute h-full bg-error-container" style={{width:`${pct/2}%`, right:'50%'}} />
                }
              </div>
              <span className={clsx('font-mono text-[10px] text-right font-bold', pos?'text-secondary':'text-tertiary')}>
                {pos?'+':''}{s.change.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── AI Summary strip ─────────────────────────────────────
function AISummary({ market }: { market: MarketSummary | null }) {
  if (!market) return null
  const dxy = market.dxy
  const gold = market.xauusd
  const vix  = market.vix

  const signal = dxy.changePct < -0.3 && gold.changePct > 0.3 ? 'Risk-Off — DXY weakening, Gold bid' :
                 dxy.changePct > 0.3 && vix.price < 18 ? 'Risk-On — DXY strengthening, low volatility' :
                 vix.price > 25 ? 'Elevated volatility — caution warranted' :
                 'Mixed signals — monitor DXY and yield spread for direction'

  const sentiment = dxy.changePct < 0 && gold.changePct > 0 ? 'Bearish USD' : dxy.changePct > 0 ? 'Bullish USD' : 'Neutral'
  const conf = Math.min(95, Math.round(60 + Math.abs(dxy.changePct + gold.changePct) * 10))

  return (
    <div className="bg-surface-container-low border border-outline-variant px-3 py-2 flex items-center gap-3 shrink-0">
      <div className="flex items-center gap-1.5 text-secondary font-bold font-mono text-label-xs shrink-0">
        <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings:"'FILL' 1"}}>bolt</span>
        AI_SIGNAL:
      </div>
      <div className="font-sans text-body-sm text-on-surface truncate flex-1">{signal}</div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={clsx('px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase border',
          sentiment.includes('Bearish') ? 'border-tertiary/30 bg-tertiary/10 text-tertiary' :
          sentiment.includes('Bullish') ? 'border-secondary/30 bg-secondary/10 text-secondary' :
          'border-outline/30 bg-outline/10 text-outline'
        )}>{sentiment}</span>
        <span className="font-mono text-[10px] text-on-surface-variant">CONF: {conf}%</span>
      </div>
    </div>
  )
}

// ── Dashboard view (main export) ─────────────────────────
interface DashboardViewProps {
  market: MarketSummary | null
  events: CalendarEvent[]
  news:   NewsItem[]
  sectors: SectorPerf[]
}

export function DashboardView({ market, events, news, sectors }: DashboardViewProps) {
  return (
    <div className="flex flex-col h-full gap-2 overflow-hidden">
      {/* AI Signal strip */}
      <AISummary market={market} />

      {/* 4 key instruments */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
        {market ? (
          <>
            <InstrumentCard label="USD INDEX (DXY)" sym="DXY" price={fmt(market.dxy.price,3)} pct={market.dxy.changePct} change={fmt(market.dxy.change,3)} high={fmt(market.dxy.high,3)} low={fmt(market.dxy.low,3)} />
            <InstrumentCard label="S&P 500" sym="SPX" price={fmt(market.sp500.price,0)} pct={market.sp500.changePct} change={fmt(market.sp500.change,1)} high={fmt(market.sp500.high,0)} low={fmt(market.sp500.low,0)} />
            <InstrumentCard label="GOLD (XAU/USD)" sym="XAU" price={'$'+fmt(market.xauusd.price,0)} pct={market.xauusd.changePct} change={'$'+fmt(market.xauusd.change,1)} high={'$'+fmt(market.xauusd.high,0)} low={'$'+fmt(market.xauusd.low,0)} />
            <InstrumentCard label="NASDAQ 100" sym="NDX" price={fmt(market.nasdaq.price,0)} pct={market.nasdaq.changePct} change={fmt(market.nasdaq.change,1)} high={fmt(market.nasdaq.high,0)} low={fmt(market.nasdaq.low,0)} />
          </>
        ) : (
          Array(4).fill(0).map((_,i) => <div key={i} className="bg-surface-container border border-outline-variant h-24 animate-pulse" />)
        )}
      </div>

      {/* Chart + right panel */}
      <div className="flex gap-2 flex-1 min-h-0">
        <MainChart />
        <div className="w-52 lg:w-60 flex flex-col gap-2 overflow-y-auto shrink-0">
          <Watchlist market={market} />
          <CalendarMini events={events} />
        </div>
      </div>

      {/* Bottom row: sectors + news */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-44 shrink-0">
        <SectorHeatmap sectors={sectors} />
        <NewsMini news={news} />
      </div>
    </div>
  )
}
