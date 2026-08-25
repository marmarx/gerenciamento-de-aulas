import { fallbackNumber } from '@/composables/helpers/helpers.utility'
import { mapsLink, whatsappLink } from '@/composables/helpers/helpers.text'
import { parseDate, dateISO } from '@/composables/helpers/helpers.date'
import { formatDuration } from '@/composables/helpers/helpers.time'
import { temporal } from '@/composables/helpers/helpers.temporal'
import { pad } from '@/composables/helpers/helpers.text'


// notifications will be set only for events/birthdays within the next n days
const timelineTreshold = 30  // in days

// all fields relevant to the fuctions belowe
const EVENT_FIELDS    = ['id_student', 'student_name', 'id_event', 'date', 'time', 'duration', 'minutesBefore']
const STUDENT_FIELDS  = ['id_student', 'student_name', 'student_phone', 'parent_phone']
const BIRTHDAY_FIELDS = ['id_student', 'student_name', 'dob']
const CONFIG_FIELDS   = ['notifyBirthday', 'notBirthDayBefore']

// Transforms UUID to numeric hash (for notification ID - numeric and unique)
const hashUUID = (uuid) => {
  let hash = 0
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash << 5) - hash + uuid.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// Valid notification time span
const checkTimespan = (notifyAt) => {
  const now = temporal.now()
  const diff = notifyAt - now
  const timespan = timelineTreshold * 24 * 60 * 60 * 1000  // days to milliseconds

  return diff > 0 && diff <= timespan // returns true if within valid timespan
}

// Checks it today is a new day -> trigger functions once a day
const isNewDay = (lastRefreshDate) => {
  const today = dateISO()
  if (!lastRefreshDate) return today

  if (lastRefreshDate === today) return false
  return today
}


// Set event notification date (minutes before event)
const notifyEventAt = (event, minutesBefore) => {
  if (!event.date || !event.time) return

  const eventMs = parseDate(event.date, event.time)
  const notifyAt = eventMs - minutesBefore * 60 * 1000 // minutes to milliseconds

  const valid = checkTimespan(notifyAt)
  if (!valid) return
  return new Date(notifyAt)
}

// Create event notification object
const eventNotification = (event, student, config) => {
  if (!event.id_event || !event.id_student || !event.date || !event.time) return
  if (!student) return

  const minutesBefore = fallbackNumber(event, student, config, 'minutesBefore')
  const notifyAt = notifyEventAt(event, minutesBefore)
  if (!notifyAt) return

  const name = student.student_name.trim().replace(/\s+/g, ' ')
  const phone = student.student_phone ? student.student_phone : student.parent_phone
  const address = student?.address
  const body_head = event.timeEnd ? `${event.time} - ${event.timeEnd}` : event.time

  const id = hashUUID(event.id_event) // must be numeric and unique

  // const title = name
  // const body = `${body_head}: Sua próxima aula com ${name} é em ${formatDuration(minutesBefore/60)}`

  // const summaryText = address ? address : ''                  // Android -> adds summaryText to body
  // const largeBody = address ? `${body} - ${address}` : body   // iOS -> replaces body with largeBody

  const title = `${body_head}: ${name}`
  const summaryText = `Em ${formatDuration(minutesBefore/60)}`
  const body = address ? address : `${body_head}: Sua próxima aula com ${name} é em ${formatDuration(minutesBefore/60)}`
  const largeBody = phone ? `${body} - ${phone}` : body
  
  const schedule = { at: notifyAt, allowWhileIdle: true }
  const extra = { whatsapp: whatsappLink(phone), maps: mapsLink(address), eventId: event.id_event, studentId: student.id_student }
  const actionTypeId = address ? 'event_actions_full' : 'event_actions_no_maps'

  const notification = { id, title, body, summaryText, largeBody, schedule, extra, smallIcon: 'notification_icon', actionTypeId } // sound: null
  return notification
}


// Get next birthday date 
const getNextBirthday = (dob) => {
  if (!dob) return null     // dob must be 'YYYY-MM-DD'

  const [_, month, day] = dob.split('-').map(Number)
  if (!Number.isInteger(month) || !Number.isInteger(day)) return null
  
  const currentYear = temporal.year()
  const nextBirthday = [currentYear, month, day].map(pad).join('-')

  const birthday = parseDate(nextBirthday)
  const now = temporal.now()
  if (birthday > now) return birthday

  const nextYearBirthday = [currentYear + 1, month, day].map(pad).join('-') // if birthday already passed this year → use next year
  return parseDate(nextYearBirthday)
}

// Set birthday notification date (one day before at 9 AM)
const notifyBirthdayAt = (dob, dayBefore) => {
  const nextBirthday = getNextBirthday(dob)
  if (!nextBirthday) return

  const hoursBefore = dayBefore ? 15 : -9 // on previous day or same day at 9:00
  const notifyAt = nextBirthday - hoursBefore * 60 * 60 * 1000

  const valid = checkTimespan(notifyAt)
  if (!valid) return

  return new Date(notifyAt)
}

// Create birthday notification object
const birthdayNotification = (student, config) => {
  if (!student.id_student || !student.student_name || !student.dob) return

  const dayBefore = config.notBirthDayBefore
  const notifyAt = notifyBirthdayAt(student.dob, dayBefore)
  if (!notifyAt) return

  const name = student.student_name.trim().replace(/\s+/g, ' ')
  const phone = student.student_phone ? student.student_phone : student.parent_phone
  const day = dayBefore ? 'amanhã' : 'hoje'

  const id = hashUUID(student.id_student) // must be numeric and unique
  const title = `Aniversário de ${name}`
  const body = `${name} faz aniversário ${day}! 🎉🎂`
  const schedule = { at: notifyAt, allowWhileIdle: true }
  const extra = { studentId: student.id_student, phone }

  const notification = { id, title, body, schedule, extra, smallIcon: 'notification_icon', actionTypeId: 'birthday_actions' } // sound: null

  return notification
}

export { EVENT_FIELDS, STUDENT_FIELDS, BIRTHDAY_FIELDS, CONFIG_FIELDS, eventNotification, birthdayNotification, hashUUID, isNewDay }