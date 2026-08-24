// npm install @js-temporal/polyfill
// import '@js-temporal/polyfill'

import { lang, timezone } from './helpers.main'
import { pad } from './helpers.text'

// miliseconds - unix epoch: January 1st, 1970, 00:00:00 UTC
const now = () => Temporal.Now.instant().epochMilliseconds

// dateISO and timeISO -> miliseconds
const ms = (d, t = '00:00', z = timezone) => {
  const time = t.split(':').map(pad).join(':')

  return d ? Temporal.ZonedDateTime.from(`${d}T${time}[${z}]`).epochMilliseconds : now()
}

// datetime object
const dateTime = (ms, z = timezone) => ms
  ? Temporal.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(z)
  : Temporal.Now.zonedDateTimeISO(z)

const plainFrom = (date) => Temporal.PlainDate.from(date)

// miliseconds -> temporal plain date
const plainDateTime = (ms, z = timezone) => dateTime(ms, z).toPlainDateTime()
const plainDate     = (ms, z = timezone) => dateTime(ms, z).toPlainDate()
const plainTime     = (ms, z = timezone) => dateTime(ms, z).toPlainTime()

// temporal components getters
const year  = (ms, z = timezone) => dateTime(ms, z).year
const month = (ms, z = timezone) => dateTime(ms, z).month
const day   = (ms, z = timezone) => dateTime(ms, z).day

const hour   = (ms, z = timezone) => dateTime(ms, z).hour
const minute = (ms, z = timezone) => dateTime(ms, z).minute
const second = (ms, z = timezone) => dateTime(ms, z).second


// locale string
const localeDateTime = (ms, opt = {}, l = lang, z = timezone) => plainDateTime(ms, z).toLocaleString(l, opt)

// formatting helpers leveraging native Temporal getters
const dateISO     = (ms, z = timezone) => plainDate(ms, z).toString() // YYYY-MM-DD
const timeISO     = (ms, z = timezone, p = 'minute') => plainTime(ms, z).toString({ smallestUnit: p }) // HH:MM or HH:MM:SS
const dateTimeISO = (ms, z = timezone, p = 'minute') => `${dateISO(ms, z)} ${timeISO(ms, p, z)}` // YYYY-MM-DD HH:MM or HH:MM:SS

const inRange = (d, t, s, e = now()) => {
  const target = temporal.ms(d, t)
  const start  = temporal.ms(s)
  const end    = temporal.ms(e, '23:59:59')

  return target >= start && target <= end
}

export const temporal = {
  now, ms,
  day, month, year,
  hour, minute, second,

  plainDateTime, localeDateTime,
  plainFrom, plainDate, plainTime,
  dateISO, timeISO, dateTimeISO,
  inRange
}