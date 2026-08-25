import { temporal } from "./helpers.temporal";

export const parseDate = (d, t = '00:00') => temporal.ms(d, t)

export const isValidDate = (date) => {
  try {
    if(typeof date === 'string' && date.includes('-')) { Temporal.PlainDate.from(date); return true }   // true for valid date strings
    temporal.plainDate(typeof date === 'number' ? date : temporal.ms(date)); return true
  }
  catch (error) { return false }
}

export const inRange = (d, s, e) => temporal.inRange(d.date, d.time, s, e)
export const filterRange = (arr, start, end) => arr.filter(e => inRange(e, start, end))

export const dateISO = d => temporal.dateISO(d)

// add days to a specific date or current date
export const addDays = (add, date = temporal.dateISO()) => {
  const plain = typeof date === 'string' && date.includes('-') 
    ? Temporal.PlainDate.from(date)
    : temporal.plainDate(typeof date === 'number' ? date : temporal.ms(date))

  return plain.add({ days: add }).toString()
}

/* DATE LABELS */
const compareLabel = (d, compare) => {
  const ms = typeof d === 'number' ? d : temporal.ms(d)
  const targetYear = temporal.year(ms)
  
  const compareYear = typeof compare === 'number' 
    ? temporal.year(compare) 
    : temporal.year(temporal.ms(compare))

  const sameYear = targetYear === compareYear

  return [ms, sameYear, targetYear]
}

// YYYY-MM-DD -> "26 de ago" OR "26 de ago de 2024"
export const dateLabel = (d, compare = temporal.now()) => {
  const [ms, sameYear, _] = compareLabel(d, compare)

  const options = {
    day: '2-digit',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' })
  }

  return temporal.localeDateTime(ms, options).replace('.', '')
}

// 2025-10-25 -> '25/10' or '25/10/2024'
export const shortDateLabel = (d, compare = temporal.now()) => {
  const [ms, sameYear, _] = compareLabel(d, compare)

  const options = {
    day: '2-digit',
    month: '2-digit',
    ...(sameYear ? {} : { year: 'numeric' }),
  }
  
  return temporal.localeDateTime(ms, options).replace('.', '')
}

//2025-10-25 -> November
export const monthLabel = (d, compare = temporal.now()) => {
  const [ms, sameYear, _] = compareLabel(d, compare)

  const options = {
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' })
  }

  return temporal.localeDateTime(ms, options).replace('.', '')
}