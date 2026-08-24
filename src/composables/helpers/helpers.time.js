import { temporal } from "./helpers.temporal"

export const timeISO = (t) => {
  if (!t) return temporal.timeISO()
  if (typeof t === 'number') return temporal.timeISO(t)
  if (t instanceof Date) return temporal.timeISO(t)
  return t
}

// 09:30 -> "9h30" or "9h"
export const horaBR = (hhmm) => {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  return `${h}h${m > 0 ? m : ''}`
}

export const addTime = (hours, minutes, date = temporal.dateISO()) => {
  const plain = typeof date === 'string' && date.includes('-') 
    ? Temporal.PlainDateTime.from(date)
    : temporal.plainDateTime(typeof date === 'number' ? date : temporal.ms(date))

  return plain.add({ hours, minutes }).toString()
}

export const formatDuration = (d) => {
  const hours = Math.floor(d)
  const minutes = Math.round((d - hours) * 60)

  const h = hours ? (hours === 1 ? "1 hora" : `${hours} horas`) : null
  const m = minutes ? (minutes === 1 ? "1 minuto" : `${minutes} minutos`) : null

  return [h, m].filter(Boolean).join(' e ')
}

export const formatDur = (d) => {
  let total = Math.round(d * 3600)  // hours → seconds

  const hours = Math.floor(total / 3600)
  total -= hours * 3600

  const minutes = Math.floor(total / 60)
  const seconds = total - minutes * 60

  const h = hours   ? `${hours}h`  : null
  const m = minutes ? `${minutes}min` : null
  const s = seconds ? `${seconds}s` : '0s'  // always show 0s when needed

  if (!h && !m) return s
  return [h, m].filter(Boolean).join(' ')
}