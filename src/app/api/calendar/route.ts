import { NextResponse } from 'next/server'

export async function GET() {
  const today = new Date().toLocaleString('en-US',{timeZone:'America/New_York'}).split(',')[0]
  const [m,d,y] = today.split('/')
  const dateStr = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`

  try {
    const r = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json',{next:{revalidate:1800},headers:{'User-Agent':'Mozilla/5.0'}})
    if (r.ok) {
      const data = await r.json()
      const events = data
        .filter((e:{date:string}) => {
          const ed = new Date(e.date).toLocaleString('en-US',{timeZone:'America/New_York'}).split(',')[0]
          const [em,edD,ey] = ed.split('/')
          return `${ey}-${em.padStart(2,'0')}-${edD.padStart(2,'0')}` === dateStr
        })
        .map((e:{date:string;currency:string;impact:string;title:string;forecast?:string;previous?:string;actual?:string}) => ({
          time: new Date(e.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',timeZone:'America/New_York'}),
          country:e.currency, event:e.title,
          impact: e.impact==='High'?'high':e.impact==='Medium'?'medium':'low',
          forecast:e.forecast||undefined, previous:e.previous||undefined, actual:e.actual||undefined,
        }))
      if (events.length > 0) return NextResponse.json({ data:events, source:'live', updatedAt:new Date().toISOString() })
    }
  } catch { /**/ }

  return NextResponse.json({
    data:[
      {time:'08:30',country:'USD',event:'Nonfarm Payrolls (Apr)',    impact:'high',  forecast:'133K',  previous:'228K'},
      {time:'08:30',country:'USD',event:'Unemployment Rate (Apr)',   impact:'high',  forecast:'4.2%',  previous:'4.2%'},
      {time:'08:30',country:'USD',event:'Avg Hourly Earnings MoM',   impact:'high',  forecast:'0.3%',  previous:'0.3%'},
      {time:'09:45',country:'USD',event:'S&P Global Mfg PMI Final',  impact:'medium',forecast:'50.7',  previous:'50.2'},
      {time:'10:00',country:'USD',event:'ISM Manufacturing PMI (Apr)',impact:'high', forecast:'48.0',  previous:'49.0'},
      {time:'10:00',country:'USD',event:'ISM Mfg Prices Paid',       impact:'medium',forecast:'69.8',  previous:'69.4'},
      {time:'16:05',country:'USD',event:'Apple (AAPL) Q1 Earnings',  impact:'high'},
      {time:'16:05',country:'USD',event:'Amazon (AMZN) Q1 Earnings', impact:'high'},
    ],
    source:'fallback', updatedAt:new Date().toISOString()
  })
}
