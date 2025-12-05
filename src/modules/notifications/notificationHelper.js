import { parseDate, dateISO, formatDuration, fallbackNumber, whatsappLink, mapsLink } from '@/composables/utility'

// notifications will be set only for events/birthdays within the next 7 days
const sevenDays = 7

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
  const now = new Date().getTime()
  const diff = notifyAt.getTime() - now
  const timespan = sevenDays * 24 * 60 * 60 * 1000  // days to milliseconds

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

  const eventDate = parseDate(event.date, event.time)
  const notifyAt = new Date(eventDate.getTime() - minutesBefore * 60 * 1000) // minutes to milliseconds

  const valid = checkTimespan(notifyAt)
  if (!valid) return
  return notifyAt
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
  const title = name
  const body = `${body_head}: Sua próxima aula com ${name} é em ${formatDuration(minutesBefore/60)}`
  const summaryText = address ? address : ''                  // Android -> adds summaryText to body
  const largeBody = address ? `${body} - ${address}` : body   // iOS -> replaces body with largeBody
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
  const now = new Date()
  let birthday = new Date(now.getFullYear(), month - 1, day)

  if (birthday < now) birthday = new Date(now.getFullYear() + 1, month - 1, day)  // if birthday already passed this year → use next year

  return birthday
}

// Set birthday notification date (one day before at 9 AM)
const notifyBirthdayAt = (dob, dayBefore) => {
  const notifyAt = getNextBirthday(dob)
  if (!notifyAt) return

  const day = notifyAt.getDate() - (dayBefore ? 1 : 0)
  notifyAt.setDate(day)
  notifyAt.setHours(9, 0, 0, 0)

  const valid = checkTimespan(notifyAt)
  if (!valid) return
  return notifyAt
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