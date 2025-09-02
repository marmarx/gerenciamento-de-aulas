// UUID function
const uuidv4 = () => "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));

// Date functions
const today = () => new Date()

const addDays = (d,n) => {
  const date = d ? new Date(d) : new Date()
  return date.setDate(date.getDate() + n)
}

const dateISO = d => new Date(d).toLocaleDateString('en-CA') //Date() -> 2025-10-25

const invertDateISO = d => { //2025-10-25 -> 25-10-2025
  if (!d) return '';
  const [year, month, day] = d.split('-');
  return `${day}/${month}/${year}`;
}

const invertDateISOnoYear = d => invertDateISO(d).slice(0,invertDateISO(d).lastIndexOf('/')) //2025-10-25 -> 25/10

// Weekday formatting functions
const weekDay = d => ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][new Date(d).getDay()+1]
const weekDays = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

const dateLabel = dataISO => {  //YYYY-MM-DD -> return Hoje, Amanhã, 26 de ago
  const today = dateISO(new Date())
  const tomorrow = dateISO(addDays(0,1))
  const format = new Intl.DateTimeFormat('pt-BR',{ day:'2-digit', month:'short' })
  return dataISO === today ? 'Hoje' : (dataISO === tomorrow ? 'Amanhã' : format.format(new Date(dataISO + 'T00:00:00')).replace('.', '').toLowerCase())
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

// Text formating function
const currency = val => val.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
const toSentenceCase = str => str.charAt(0).toUpperCase() + str.toLowerCase().slice(1)

// Link functions
const whatsappLink = phone => phone ? `https://wa.me/${phone.replace(/[ +\-\(\)'"]/g, '')}` : ''
const mapsLink = address => address.trim() ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}` : ''

export { uuidv4, today, addDays, dateISO, invertDateISO, invertDateISOnoYear, weekDay, weekDays, dateLabel, timeISO, horaBR, formatTime, currency, toSentenceCase, whatsappLink, mapsLink }