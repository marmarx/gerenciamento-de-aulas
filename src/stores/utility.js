// UUID function
const uuidv4 = () => "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));

// Date functions
const today = () => new Date()

const addDays = (d,n) => {
  const date = d ? new Date(d) : new Date()
  return date.setDate(date.getDate() + n)
}

const monthLabel = d => new Date(d).toLocaleString('default', { month: 'long' }) //2025-10-25 -> November
const dateISO = d => new Date(d).toLocaleDateString('en-CA') //Date() -> 2025-10-25

const invertDateISO = d => { //2025-10-25 -> 25/10/2025
  if (!d) return '';
  const [year, month, day] = d.split('-');
  return `${day}/${month}/${year}`;
}

const isValidDate = d => !isNaN(new Date(d))  // true for valid date strings

const invertDateISOnoYear = d => invertDateISO(d).slice(0,invertDateISO(d).lastIndexOf('/')) //2025-10-25 -> 25/10

// Weekday formatting functions
const weekDay = d => ["Seg","Ter","Qua","Qui","Sex","Sáb", "Dom"][new Date(d).getDay()]
const weekDays = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

const weekLabel = d => {
  const today = dateISO(new Date())
  const tomorrow = dateISO(addDays(0,1))
  const yesterday = dateISO(addDays(0,-1))

  if (d === today) return 'Hoje'
  if (d === tomorrow) return 'Amanhã'
  if (d === yesterday) return 'Ontem'
  return weekDay(d)
}

const dateLabel = dataISO => {  // YYYY-MM-DD -> "26 de ago" OR "26 de ago de 2024"
  const date = new Date(dataISO);
  const sameYear = date.getFullYear() === new Date().getFullYear()

  const format = new Intl.DateTimeFormat('default', {
    day: '2-digit',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })

  return format.format(new Date(dataISO + 'T00:00:00')).replace('.', '').toLowerCase()
}

// Time formatting functions
const timeISO = time => time.toLocaleTimeString('pt-BR').slice(0, -3) //Date() -> 09:00 - .toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' })

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

const toTimeString = (minutes) => {
  const total = (minutes + 1440) % 1440 // keep in [0, 1440)
  const h = String(Math.floor(total / 60)).padStart(2, '0')
  const m = String(total % 60).padStart(2, '0')
  return `${h}:${m}`
}

// Text formating function
const currency = val => val.toLocaleString('default', { style: 'currency', currency: 'BRL' })//.replace('-R$','- R$')
const toSentenceCase = str => str.charAt(0).toUpperCase() + str.toLowerCase().slice(1)

// Link functions
const whatsappLink = phone => phone ? `https://wa.me/${phone.replace(/[ +\-\(\)'"]/g, '')}` : ''
const mapsLink = address => address.trim() ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}` : ''

const sortByStr = (arr, prop) => arr.sort((a, b) => a[prop].toLowerCase().localeCompare(b[prop].toLowerCase()))
const sortByDate = (arr, prop) => arr.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

export {
  uuidv4,
  today, addDays, dateISO, invertDateISO, invertDateISOnoYear, isValidDate,
  weekDay, weekDays, dateLabel, weekLabel, monthLabel,
  timeISO, horaBR, formatTime, toTimeString, toMinutes,
  currency, toSentenceCase, whatsappLink, mapsLink
}