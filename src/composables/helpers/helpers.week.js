import { weekstart } from './helpers.main'
import { temporal } from "./helpers.temporal"
import { addDays } from './helpers.date'
import { toSentenceCase } from './helpers.text'

export const shortWeekday = (d, size = 'short') => {
  const ms = typeof d === 'number' ? d : temporal.ms(d)
  const dateName = temporal.localeDateTime(ms, { weekday: size })
  return toSentenceCase(dateName).replace('.', '').replace('-feira', '')
}

export const longWeekday = d => shortWeekday(d, 'long')

export const weekdayFromIndex = (size) => Array.from({ length: 7 })
  .map((_, i) => {
    const date = `2025-11-${16 + i + weekstart}`  // 2025-11-16 is a Sunday — day 0
    return size === 'long' ? longWeekday(date) : shortWeekday(date)
  })

export const shortWeekdays = weekdayFromIndex('short')
export const longWeekdays =  weekdayFromIndex('long')


// Returns "Hoje", "Amanhã", "Ontem", or the abbreviated weekday ("Seg", "Ter", etc)
export const weekLabel = (d) => {
  const targetISO = (typeof d === 'string' && d.includes('-')) ? d : temporal.dateISO(d)
  const today = temporal.dateISO()
  const tomorrow = addDays(1, today)
  const yesterday = addDays(-1, today)

  if (targetISO === today) return 'Hoje'
  if (targetISO === tomorrow) return 'Amanhã'
  if (targetISO === yesterday) return 'Ontem'

  return shortWeekday(targetISO)
}

// 1- Monday, 7- Sunday
export const weekDay = (ms) => temporal.plainDate(ms).dayOfWeek