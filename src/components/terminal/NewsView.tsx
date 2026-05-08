'use client'
import type { NewsItem } from '@/lib/types'
import { timeAgo } from '@/lib/market-data'
import { clsx } from 'clsx'

const catColor: Record<string,string> = {
  earnings:'text-primary', macro:'text-neutral', fed:'text-secondary',
  geopolitics:'text-tertiary', energy:'text-warn', general:'text-outline',
}

export function NewsView({ news }: { news: NewsItem[] }) {
  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      <div className="flex items-center gap-3 shrink-0">
        <span className="material-symbols-outlined text-primary text-[20px]">newspaper</span>
        <div>
          <div className="font-sans font-bold text-headline-sm text-on-surface">Market News</div>
          <div className="font-mono text-label-xs text-outline">Live feed · Categorized by sentiment</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {news.map(item => (
          <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
            className="flex gap-3 bg-surface-container-lowest border border-outline-variant px-3 py-2.5 terminal-row cursor-pointer group block">
            {/* Sentiment bar */}
            <div className={clsx('w-0.5 self-stretch shrink-0',
              item.sentiment==='positive' ? 'bg-secondary' :
              item.sentiment==='negative' ? 'bg-tertiary' : 'bg-outline'
            )} />
            <div className="flex-1 min-w-0">
              <div className="font-sans text-[12px] text-on-surface leading-snug group-hover:text-primary transition-colors mb-1.5">
                {item.headline}
              </div>
              <div className="flex items-center gap-2 flex-wrap font-mono text-[9px]">
                <span className={catColor[item.category] ?? 'text-outline'}>{item.category.toUpperCase()}</span>
                <span className="text-outline">·</span>
                <span className="text-on-surface-variant">{item.source}</span>
                <span className="text-outline">·</span>
                <span className="text-outline">{timeAgo(item.publishedAt)}</span>
                {item.tickers?.map(t => (
                  <span key={t} className="bg-primary/10 text-primary border border-primary/20 px-1">{t}</span>
                ))}
              </div>
            </div>
            <span className="material-symbols-outlined text-[12px] text-outline group-hover:text-on-surface-variant shrink-0 mt-0.5">open_in_new</span>
          </a>
        ))}
        {news.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-outline">
            <span className="material-symbols-outlined text-[36px] mb-2 opacity-40">feed</span>
            <div className="font-mono text-[11px]">Loading news feed...</div>
          </div>
        )}
      </div>
    </div>
  )
}
