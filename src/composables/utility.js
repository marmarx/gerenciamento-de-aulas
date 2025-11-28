const lang = 'pt-BR'            // default, pt-BR, en-US, en-GB, fr-FR, de-DE
const displayCurrency = 'BRL'   // default, BRL, USD, GBP, EUR, EUR
const timezone = '-0300'        
const startWeek = 0;            //-1: Saturday, 0: Sunday, 1: Monday

document.documentElement.lang = lang

// UUID function
const uuidv4 = () => "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16))


// Text formating function
const currency = val => val.toLocaleString(lang, { style: 'currency', currency: displayCurrency })//.replace('-R$','- R$')
const toSentenceCase = str => str.charAt(0).toUpperCase() + str.toLowerCase().slice(1)


// Date functions
const parseDate = (d, t = '00:00') => { // YYYY-MM-DD and hh:mm -> new Date() - full datetime (date + time in local) - safer than new Date(`${d}T${t}`)
  const [y, m, day] = d.split('-').map(Number)
  const [h, min] = t.split(':').map(Number)
  return new Date(y, m - 1, day, h, min)
}
const isValidDate = d => !isNaN(new Date(d))  // true for valid date strings

const inRange = (e, start, end) => parseDate(e.date, e.time) >= parseDate(start) && parseDate(e.date, e.time) <= parseDate(end, '23:59')
const filterRange = (arr, start, end) => arr.filter(e => inRange(e, start, end))

const dateISO = d => new Date(d).toLocaleDateString('en-CA') //Date() -> YYYY-MM-DD
//const dateISO = d => `${new Date(d).getFullYear()}-${String(new Date(d).getMonth()+1).padStart(2,"0")}-${String(new Date(d).getDate()).padStart(2,"0")}`

const addDays = (d,n) => {
  const date = d ? parseDate(d) : new Date()
  const newDate = date.setDate(date.getDate() + n)
  return dateISO(newDate)
}


// Weekday formatting functions
const shortWeekday = (d, size = 'short') => toSentenceCase(parseDate(d).toLocaleString(lang, {weekday: size})).replace('.','').replace('-feira','')
const longWeekday = d => shortWeekday(d, 'long')

const weekdayFromIndex = (size) => Array.from({ length: 7 })
  .map((_, i) => {
    const date = `2025-11-${16 + i + startWeek}`  // 2025-11-16 is a Sunday — day 0
    return size === 'long' ? longWeekday(date) : shortWeekday(date)
  })

const shortWeekdays = weekdayFromIndex('short')
const longWeekdays =  weekdayFromIndex('long')


// Label functions
const dateLabel = dataISO => {  // YYYY-MM-DD -> "26 de ago" OR "26 de ago de 2024"
  const date = parseDate(dataISO);
  const sameYear = date.getFullYear() === new Date().getFullYear()

  const options = {
    day: '2-digit',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  }

  return date.toLocaleString(lang, options).replace('.', '')
}

const shortDateLabel = dataISO => { //2025-10-25 -> '25/10' or '25/10/2024'
  const date = parseDate(dataISO);
  const sameYear = date.getFullYear() === new Date().getFullYear()

  const options = {
    day: '2-digit',
    month: '2-digit',
    ...(sameYear ? {} : { year: 'numeric' }),
  }
  
  return date.toLocaleString(lang, options)
}

const monthLabel = d => parseDate(d).toLocaleString(lang, { month: 'long' }) //2025-10-25 -> November //new Date()

const weekLabel = d => {
  const today = dateISO(new Date())
  const tomorrow = addDays(0,1)
  const yesterday = addDays(0,-1)

  if (d === today) return 'Hoje'
  if (d === tomorrow) return 'Amanhã'
  if (d === yesterday) return 'Ontem'
  return shortWeekday(d)
}


// Time formatting functions
const timeISO = time => new Date(time).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) //string or Date() -> 09:00 - hour12: false

const horaBR = hhmm => { //string -> 9h30 or 9h
  if (!hhmm) return '';
  const [h,m] = hhmm.split(':');
  return `${h}h${m>0?m:''}`
}

const formatDuration = (d) => {
  const hours = Math.floor(d)
  const minutes = Math.round((d - hours) * 60)

  const h = hours ? (hours === 1 ? "1 hora" : `${hours} horas`) : null
  const m = minutes ? (minutes === 1 ? "1 minuto" : `${minutes} minutos`) : null

  return [h, m].filter(Boolean).join(' e ')
}

const formatDur = (d) => {
  const hours = Math.floor(d)
  const minutes = Math.round((d - hours) * 60)

  const h = hours ? `${hours}h` : null
  const m = minutes ? `${minutes}min` : null

  return [h, m].filter(Boolean).join('')
}


// Fallback values
const isNumeric = v => 
  v !== '' &&
  v !== null &&
  v !== undefined &&
  (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(v)))

const fallbackNumber = (event, student, config, key) => {
  const fromEvent = event[key]
  if (isNumeric(fromEvent)) return Number(fromEvent)

  const fromStudent = student?.[key]
  if (isNumeric(fromStudent)) return Number(fromStudent)

  return Number(config[key])
}

const fallbackBool = (event, student, config, key) => {
  const fromEvent = event[key]
  if (typeof fromEvent === 'boolean') return fromEvent

  const fromStudent = student?.[key]
  if (typeof fromStudent === 'boolean') return fromStudent

  return Boolean(config[key])
}


// Link functions
const whatsappLink = phone => phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : ''
const mapsLink = address => address.trim() ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}` : ''

const sortByStr = (arr, prop) => arr.sort((a, b) => a[prop].toLowerCase().localeCompare(b[prop].toLowerCase()))
const sortByDate = (arr) => arr.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))


export {
  lang, uuidv4,
  parseDate, filterRange, inRange,
  addDays, dateISO, isValidDate,
  shortWeekday, longWeekday, longWeekdays, shortWeekdays,
  dateLabel, shortDateLabel, weekLabel, monthLabel,
  timeISO, horaBR, formatDuration, formatDur,
  currency, toSentenceCase, whatsappLink, mapsLink,
  fallbackNumber, fallbackBool
}


/*
// generateUniqueId() is overkill - uuidv4 provides a trillion options, collision probability is so small it's effectively impossible
const generateUniqueId = () => {
  const used = new Set([...dataStore.data.payments, ...dataStore.data.events].map(i => i.id_pay || i.id_event))
  let id
  do { id = uuidv4() } while (used.has(id));
  return id;
}

// ??, ||, or :? operators
?? -> null, undefined
|| or :? -> false, 0, '', null, undefined, NaN

// VSCode replace - regular expressions enabled
new\s+Date\(([^)]+)\) -> parseDate($1) -> replace all 'new Date(...)' by 'parseDate(...)', skips 'new Date()'
new\s+Date\(([^)]*)\) -> parseDate($1) -> replace all 'new Date(...)' by 'parseDate(...)', does NOT skip 'new Date()'
*/