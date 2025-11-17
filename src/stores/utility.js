const lang = 'pt-BR'
const displayCurrency = 'BRL'
const startWeek = 1; //0 - Saturday, 1 - Sunday, 2 - Monday

// UUID function
const uuidv4 = () => "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16))
/*
// overkill - uuidv4 provides a trillion options, collision probability is so small it's effectively impossible
const generateUniqueId = () => {
  const used = new Set([...dataStore.data.payments, ...dataStore.data.events].map(i => i.id_pay || i.id_event))
  let id
  do { id = uuidv4()} while (used.has(id));
  return id;
}
*/

// Text formating function
const currency = val => val.toLocaleString(lang, { style: 'currency', currency: displayCurrency })//.replace('-R$','- R$')
const toSentenceCase = str => str.charAt(0).toUpperCase() + str.toLowerCase().slice(1)

// Date functions
const isValidDate = d => !isNaN(new Date(d))  // true for valid date strings

const addDays = (d,n) => {
  const date = d ? new Date(d) : new Date()
  return date.setDate(date.getDate() + n)
}

const invertDateISO = d => { //2025-10-25 -> 25/10/2025
  if (!d) return '';
  const [year, month, day] = d.split('-');
  return `${day}/${month}/${year}`;
}
const dateISO = d => new Date(d).toLocaleDateString('en-CA') //Date() -> 2025-10-25
const invertDateISOnoYear = d => invertDateISO(d).slice(0,invertDateISO(d).lastIndexOf('/')) //2025-10-25 -> 25/10

const monthLabel = d => new Date(d).toLocaleString(lang, { month: 'long' }) //2025-10-25 -> November
const dateLabel = dataISO => {  // YYYY-MM-DD -> "26 de ago" OR "26 de ago de 2024"
  const date = new Date(dataISO);
  const sameYear = date.getFullYear() === new Date().getFullYear()

  const format = new Intl.DateTimeFormat(lang, {
    day: '2-digit',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })

  return format.format(new Date(dataISO + 'T00:00:00')).replace('.', '').toLowerCase()
}

// Weekday formatting functions
const shortWeekday = d => toSentenceCase(new Date(d).toLocaleString(lang, {weekday: 'short'}).replace('.',''))
const longWeekday = d => toSentenceCase(new Date(d).toLocaleString(lang, {weekday: 'long'}).replace('-feira',''))

const shortWeekdays = [23, 24, 25, 26, 27, 28, 29].map(d => shortWeekday(`2025-11-${d+startWeek}`))
const longWeekdays  = [23, 24, 25, 26, 27, 28, 29].map(d => longWeekday(`2025-11-${d+startWeek}`))

const weekLabel = d => {
  const today = dateISO(new Date())
  const tomorrow = dateISO(addDays(0,1))
  const yesterday = dateISO(addDays(0,-1))

  if (d === today) return 'Hoje'
  if (d === tomorrow) return 'Amanhã'
  if (d === yesterday) return 'Ontem'
  return shortWeekday(d)
}

// Time formatting functions
const timeISO = time => time.toLocaleTimeString(lang).slice(0, -3) //Date() -> 09:00 - .toLocaleTimeString(lang, { hour12: false, hour: '2-digit', minute: '2-digit' })

const formatTime = time => { //string -> 09:00
  const [h, m] = time.split(":").map(Number)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

const horaBR = hhmm => { //string -> 9h30 or 9h
  if (!hhmm) return '';
  const [h,m] = hhmm.split(':');
  return `${h}h${m>0?m:''}`
}

const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

const toTimeString = (minutes) => { //minutes -> hh:mm
  const total = (minutes + 1440) % 1440 // keep in [0, 1440)
  const h = String(Math.floor(total / 60)).padStart(2, '0')
  const m = String(total % 60).padStart(2, '0')
  return `${h}:${m}`
}

const formatDuration = (d) => {
  const hours = Math.floor(d)
  const minutes = Math.round((d - hours) * 60)

  const h = hours ? (hours === 1 ? "1 hora" : `${hours} horas`) : null
  const m = minutes ? (minutes === 1 ? "1 minuto" : `${minutes} minutos`) : null

  return [h, m].filter(Boolean).join(' e ')
}

// Link functions
const whatsappLink = phone => phone ? `https://wa.me/${phone.replace(/[ +\-\(\)'"]/g, '')}` : ''
const mapsLink = address => address.trim() ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}` : ''

const sortByStr = (arr, prop) => arr.sort((a, b) => a[prop].toLowerCase().localeCompare(b[prop].toLowerCase()))
const sortByDate = (arr) => arr.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

export {
  lang, 
  uuidv4,
  addDays, dateISO, invertDateISO, invertDateISOnoYear, isValidDate,
  shortWeekday, longWeekday, longWeekdays, shortWeekdays,
  dateLabel, weekLabel, monthLabel,
  timeISO, horaBR, formatTime, formatDuration,
  currency, toSentenceCase, whatsappLink, mapsLink
}