let scheduledTimeouts = []

self.addEventListener('install', () => {
  console.log('[SW] Installed')
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  console.log('[SW] Activated')
  event.waitUntil((async () => {
    await self.clients.claim()
    const saved = await getFromIndexedDB('notifData')
    if (saved) {
      console.log('[SW] Restoring saved notifications:', saved)
      scheduleNotifications(saved)
    }
  })())
})

self.addEventListener('message', async event => {
  if (event.data?.type === 'UPDATE_NOTIFICATIONS') {
    const { events, minutesBefore } = event.data.payload
    console.log(events)
    const cleaned = removePastEvents(events)
    const store = { events: cleaned, minutesBefore }
    await saveToIndexedDB('notifData', store)
    scheduleNotifications(store)
  }

  // 🧹 Handle clear request from app
  if (event.data?.type === 'CLEAR_NOTIFICATIONS') {
    console.log('[SW] Clearing all stored notifications...')
    scheduledTimeouts.forEach(id => clearTimeout(id))
    scheduledTimeouts = []
    await saveToIndexedDB('notifData', { events: [], minutesBefore: 0 })
  }
})

// === Notification scheduling ===
function scheduleNotifications(data) {
  // Clear previous timeouts
  scheduledTimeouts.forEach(id => clearTimeout(id))
  scheduledTimeouts = []

  const now = Date.now()
  const { events, minutesBefore } = data

  // Clean and sort upcoming events
  const upcoming = events
    .map(e => ({
      ...e,
      notifyAt: new Date(`${e.date}T${e.time}`).getTime() - minutesBefore * 60000,
    }))
    .filter(e => e.notifyAt > now)
    .sort((a, b) => a.notifyAt - b.notifyAt)

  if (upcoming.length === 0) {
    console.log('[SW] No upcoming events to schedule.')
    return
  }

  console.log(`[SW] Scheduling ${upcoming.length} notifications...`)

  // Schedule each event
  for (const event of upcoming) {
    const delay = event.notifyAt - now
    console.log(`[SW] → Event with ${event.name || event.id || 'Event'} in ${Math.round(delay / 60000)} min`)
    const id = setTimeout(() => {
      showNotification(event)
      autoCleanExpired()
    }, delay)
    scheduledTimeouts.push(id)
  }

  // Save updated schedule
  saveToIndexedDB('notifData', { events: upcoming, minutesBefore })
}

const showNotification = (event) => {
  const title = `${event.name}`
  const options = {
    body: `Sua próxima aula com ${event.name} é em ${minutesBefore} minuto${minutesBefore==1?'s':''} (${event.date} - ${event.time})`,
    icon: '/icon192.png',
    badge: '/icon96.png',
    tag: event.name || event.id || 'Event',
  }
  self.registration.showNotification(title, options)
}

// === IndexedDB helpers ===
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NotificationDB', 1)
    request.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data')
      }
    }
    request.onsuccess = e => resolve(e.target.result)
    request.onerror = e => reject(e.target.error)
  })
}

async function saveToIndexedDB(key, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite')
    tx.objectStore('data').put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = e => reject(e.target.error)
  })
}

async function getFromIndexedDB(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readonly')
    const req = tx.objectStore('data').get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = e => reject(e.target.error)
  })
}

// === Handle notification clicks ===
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      const client = clientsArr.find(c => 'focus' in c)
      if (client) return client.focus()
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})

// === Auto-cleanup helpers ===
function removePastEvents(events) {
  const now = new Date()
  return events.filter(e => {
    const eventTime = new Date(`${e.date}T${e.time}`)
    return eventTime.getTime() >= now.getTime()
  })
}

async function autoCleanExpired() {
  const data = await getFromIndexedDB('notifData')
  if (!data || !data.events) return
  const cleaned = removePastEvents(data.events)
  if (cleaned.length !== data.events.length) {
    console.log(`[SW] Auto-cleaned ${data.events.length - cleaned.length} expired events.`)
    await saveToIndexedDB('notifData', { ...data, events: cleaned })
  }
}