// UUID function
export const uuidv4 = () => "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16))

/*
// generateUniqueId() is overkill - uuidv4 provides a trillion options, collision probability is so small it's effectively impossible
const generateUniqueId = () => {
  const used = new Set([...dataStore.sortedPayments, ...dataStore.sortedEvents].map(i => i.id_pay || i.id_event))
  let id
  do { id = uuidv4() } while (used.has(id));
  return id;
}
*/

// Fallback values
export const isNumeric = v => 
  v !== '' &&
  v !== null &&
  v !== undefined &&
  (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(v)))

export const fallbackNumber = (event, student, config, key) => {
  const fromEvent = event[key]
  if (isNumeric(fromEvent)) return Number(fromEvent)

  const fromStudent = student?.[key]
  if (isNumeric(fromStudent)) return Number(fromStudent)

  return Number(config[key])
}

export const fallbackBool = (event, student, config, key) => {
  const fromEvent = event[key]
  if (typeof fromEvent === 'boolean') return fromEvent

  const fromStudent = student?.[key]
  if (typeof fromStudent === 'boolean') return fromStudent

  return Boolean(config[key])
}