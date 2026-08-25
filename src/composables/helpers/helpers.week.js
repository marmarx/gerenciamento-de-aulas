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

const weekdayFromIndex = (size) => {
  const weekdays = []
  for (let i = 0; i < 7; i++)  {
    const date = `2026-08-${24 + i + weekstart}`  // 2026-08-24 is a Monday
    const label = shortWeekday(date, size)
    const value = Temporal.PlainDate.from(date).dayOfWeek
    weekdays.push({ value, label })
  }
  return weekdays
}

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