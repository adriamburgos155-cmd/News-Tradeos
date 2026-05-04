'use client'
'use client'
import { useState, useEffect } from 'react'
import { useMarket, useNews, useCalendar, useFred } from '@/hooks/useMarketData'
import { MOCK_SECTORS } from '@/lib/market-data'
import type { MarketSummary } from '@/lib/types'
import { TopBar }        from '@/components/terminal/TopBar'
import { Sidebar }       from '@/components/terminal/Sidebar'
import type { NavPage }  from '@/components/terminal/Sidebar'
import { TickerBar }     from '@/components/terminal/TickerBar'
import { SettingsPanel } from '@/components/terminal/SettingsPanel'
import { DashboardView } from '@/components/terminal/DashboardView'
import { CalendarView }  from '@/components/terminal/CalendarView'
import { NewsView }      from '@/components/terminal/NewsView'
import { HeatmapView }   from '@/components/terminal/HeatmapView'
import { FredView }      from '@/components/fred/FredView'
import { ChatPanel }     from '@/components/chat/ChatPanel'

export default function Terminal() {
  const { market: rawMarket, isMock } = useMarket()
  const market = (rawMarket ?? null) as MarketSummary | null
  const { news }                   = useNews()
  const { events, source }         = useCalendar()
  const { fred, isMock: fredMock } = useFred()

  const [page,         setPage]        = useState<NavPage>('dashboard')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [chatOpen,     setChatOpen]    = useState(false)
  const [hasKey,       setHasKey]      = useState(false)

  useEffect(() => {
    const check = () => setHasKey(!!localStorage.getItem('gi_groq_key'))
    check()
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [settingsOpen])

  return (
    <div className="h-screen flex flex-col bg-black text-on-surface overflow-hidden">
      <TopBar market={market} isMock={isMock} onOpenSettings={() => setSettingsOpen(true)} />
      <div className="flex flex-1 min-h-0 pt-10 pb-6">
        <Sidebar active={page} onChange={setPage} hasGroqKey={hasKey} onOpenSettings={() => setSettingsOpen(true)} />
        <main className="flex-1 min-w-0 ml-12 md:ml-44 overflow-hidden px-3 pt-3 pb-1">
          {page === 'dashboard' && <DashboardView market={market} events={events} news={news} sectors={MOCK_SECTORS} />}
          {page === 'fred'      && <FredView fred={fred} isMock={fredMock} />}
          {page === 'calendar'  && <CalendarView events={events} source={source} />}
          {page === 'heatmap'   && <HeatmapView />}
          {page === 'news'      && <NewsView news={news} />}
        </main>
      </div>
      <TickerBar market={market} />
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)} className="fixed bottom-8 right-4 z-40 flex items-center gap-2 bg-primary text-on-primary font-mono text-[11px] font-bold px-4 py-2 border border-primary/30 hover:bg-primary/80 transition-colors shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-on-primary live-dot" />AI_ANALYST
        </button>
      )}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} onOpenSettings={() => { setChatOpen(false); setSettingsOpen(true) }} market={market} fred={fred} />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
