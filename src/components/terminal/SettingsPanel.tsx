'use client'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface SettingsPanelProps { isOpen: boolean; onClose: () => void }

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [groqKey,   setGroqKey]   = useState('')
  const [fredKey,   setFredKey]   = useState('')
  const [showGroq,  setShowGroq]  = useState(false)
  const [showFred,  setShowFred]  = useState(false)
  const [testState, setTestState] = useState<'idle'|'testing'|'ok'|'fail'>('idle')

  useEffect(() => {
    if (isOpen) {
      setGroqKey(localStorage.getItem('gi_groq_key') || '')
      setFredKey(localStorage.getItem('gi_fred_key') || '')
      setTestState('idle')
    }
  }, [isOpen])

  const save = () => {
    if (groqKey.trim()) localStorage.setItem('gi_groq_key', groqKey.trim())
    else localStorage.removeItem('gi_groq_key')
    if (fredKey.trim()) localStorage.setItem('gi_fred_key', fredKey.trim())
    else localStorage.removeItem('gi_fred_key')
    onClose()
  }

  const testGroq = async () => {
    if (!groqKey.trim()) return
    setTestState('testing')
    try {
      const r = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages:[{role:'user',content:'Say OK only.'}], apiKey:groqKey.trim() })
      })
      setTestState(r.ok ? 'ok' : 'fail')
    } catch { setTestState('fail') }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in" onClick={onClose}>
      <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-md mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">api</span>
            <span className="font-sans font-bold text-headline-sm text-on-surface">API Config</span>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Groq */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-label-xs text-outline uppercase">Groq API Key — AI Chat</label>
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                className="font-mono text-[9px] text-primary hover:underline flex items-center gap-1">
                Get free key <span className="material-symbols-outlined text-[10px]">open_in_new</span>
              </a>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type={showGroq?'text':'password'} value={groqKey}
                  onChange={e => { setGroqKey(e.target.value); setTestState('idle') }}
                  placeholder="gsk_..."
                  className={clsx('w-full bg-black border px-3 py-2 font-mono text-[11px] text-on-surface placeholder:text-outline outline-none transition-colors pr-8',
                    testState==='ok' ? 'border-secondary' : testState==='fail' ? 'border-tertiary' : groqKey ? 'border-outline focus:border-primary' : 'border-outline-variant focus:border-primary'
                  )}
                />
                <button onClick={() => setShowGroq(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                  <span className="material-symbols-outlined text-[14px]">{showGroq?'visibility_off':'visibility'}</span>
                </button>
              </div>
              <button onClick={testGroq} disabled={!groqKey.trim()||testState==='testing'}
                className="border border-outline-variant px-3 font-mono text-[10px] text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 transition-colors">
                {testState==='testing' ? '...' : 'Test'}
              </button>
            </div>
            {testState==='ok'   && <div className="font-mono text-[9px] text-secondary mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[11px]">check_circle</span>Valid key — AI ready</div>}
            {testState==='fail' && <div className="font-mono text-[9px] text-tertiary mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[11px]">error</span>Invalid key</div>}
            <div className="font-sans text-[10px] text-outline mt-1">Stored locally in your browser. Never sent to our servers. Free tier available.</div>
          </div>

          <div className="border-t border-outline-variant" />

          {/* FRED */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-label-xs text-outline uppercase">FRED API Key — Macro Data</label>
              <a href="https://fredaccount.stlouisfed.org/apikeys" target="_blank" rel="noopener noreferrer"
                className="font-mono text-[9px] text-primary hover:underline flex items-center gap-1">
                Get free key <span className="material-symbols-outlined text-[10px]">open_in_new</span>
              </a>
            </div>
            <div className="relative">
              <input type={showFred?'text':'password'} value={fredKey}
                onChange={e => setFredKey(e.target.value)}
                placeholder="32-character FRED key..."
                className="w-full bg-black border border-outline-variant px-3 py-2 font-mono text-[11px] text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors pr-8"
              />
              <button onClick={() => setShowFred(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[14px]">{showFred?'visibility_off':'visibility'}</span>
              </button>
            </div>
            <div className="font-sans text-[10px] text-outline mt-1">
              Required for live FRED data (CPI, Fed Rate, Yields, GDP, M2). Without it, realistic demo data is shown.
            </div>
          </div>

          <div className="border-t border-outline-variant" />

          {/* Status */}
          <div className="space-y-1.5">
            <div className="font-mono text-label-xs text-outline uppercase mb-2">Data Sources</div>
            {[
              { name:'Yahoo Finance', status:'active', desc:'Real-time quotes — no key' },
              { name:'ForexFactory',  status:'active', desc:'Economic calendar — no key' },
              { name:'Groq AI',       status:groqKey?'active':'needs_key', desc:groqKey?'AI chat ready':'Add key above' },
              { name:'FRED (St. Louis Fed)', status:fredKey?'active':'demo', desc:fredKey?'Live macro data':'Demo data — add key for live' },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div>
                  <span className="font-sans text-[11px] text-on-surface-variant">{s.name}</span>
                  <span className="font-sans text-[10px] text-outline ml-2">{s.desc}</span>
                </div>
                <span className={clsx('font-mono text-[8px] border px-1.5 py-0.5',
                  s.status==='active'    ? 'border-secondary/30 text-secondary' :
                  s.status==='needs_key' ? 'border-warn/30 text-warn' :
                  'border-outline-variant text-outline'
                )}>
                  {s.status==='active'?'● LIVE':s.status==='demo'?'◌ DEMO':'○ OFF'}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 bg-primary text-on-primary font-sans font-bold text-[12px] py-2.5 hover:bg-primary/80 transition-colors">
              Save & Close
            </button>
            <button onClick={onClose} className="px-4 border border-outline-variant text-on-surface-variant hover:text-on-surface font-sans text-[12px] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
