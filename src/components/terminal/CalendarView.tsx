'use client'
import type { CalendarEvent } from '@/lib/types'
import { clsx } from 'clsx'

const impactColor = { high:'text-tertiary', medium:'text-warn', low:'text-outline' }
const impactDot   = { high:'bg-tertiary',   medium:'bg-warn',   low:'bg-outline'   }
const impactBorder= { high:'border-l-tertiary', medium:'border-l-warn', low:'border-l-outline-variant' }

export function CalendarView({ events, source }: { events: CalendarEvent[]; source: string }) {
  const today = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'America/New_York'})
  const highCount = events.filter(e => e.impact === 'high').length

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
          <div>
            <div className="font-sans font-bold text-headline-sm text-on-surface">Economic Calendar</div>
            <div className="font-mono text-label-xs text-outline">{today} · EST</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {source === 'live' && (
            <span className="font-mono text-[9px] text-secondary border border-secondary/30 px-2 py-0.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-secondary live-dot" />LIVE
            </span>
          )}
          {highCount > 0 && (
            <span className="font-mono text-[9px] text-tertiary border border-tertiary/30 px-2 py-0.5">
              {highCount} HIGH IMPACT
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 font-mono text-[9px] text-outline shrink-0 border-b border-outline-variant pb-2">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-tertiary" />High Impact</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-warn" />Medium</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-outline" />Low</span>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-outline">
            <span className="material-symbols-outlined text-[36px] mb-2 opacity-40">event_busy</span>
            <div className="font-mono text-[11px]">No events scheduled for today</div>
          </div>
        ) : events.map((ev, i) => (
          <div key={i} className={clsx(
            'bg-surface-container-lowest border border-outline-variant border-l-2 px-3 py-2.5 terminal-row',
            impactBorder[ev.impact]
          )}>
            <div className="grid grid-cols-[52px_1fr_auto] gap-x-3 items-start">
              {/* Time */}
              <div className="font-mono text-data-sm text-on-surface-variant pt-0.5">{ev.time}</div>

              {/* Event details */}
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-[9px] px-1 py-0.5 bg-surface-container text-on-surface-variant border border-outline-variant">
                    {ev.country}
                  </span>
                  <span className="font-sans text-[12px] text-on-surface">{ev.event}</span>
                </div>
                {(ev.forecast || ev.previous || ev.actual) && (
                  <div className="flex items-center gap-4 font-mono text-[9px]">
                    {ev.forecast && <span className="text-outline">Forecast: <span className="text-primary">{ev.forecast}</span></span>}
                    {ev.previous && <span className="text-outline">Previous: <span className="text-on-surface-variant">{ev.previous}</span></span>}
                    {ev.actual   && <span className="text-outline">Actual: <span className="text-secondary font-bold">{ev.actual}</span></span>}
                  </div>
                )}
              </div>

              {/* Impact badge */}
              <div className="flex flex-col items-end gap-1">
                <span className={clsx('font-mono text-[8px] uppercase font-bold', impactColor[ev.impact])}>
                  {ev.impact}
                </span>
                <span className={clsx('w-2 h-2 rounded-full', impactDot[ev.impact])} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
