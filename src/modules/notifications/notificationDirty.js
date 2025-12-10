import { eventNotification, birthdayNotification } from '@/modules/notifications/notificationHelper'
import { scheduleNotifications, cancelNotificationById, removeDeliveredNotifications } from '@/modules/notifications/notificationMain'
import { useDataStore } from '@/stores/dataStore'

let dirtyTimer = null
const dirtyItems = new Map()

// mark events notifications that to be updated
const markEventDirty = (id) => {
  dirtyItems.set(`event-${id}`, { type: 'event', id })
  queueDirtyProcessing()
}

// mark students notifications that to be updated
const markBirthdayDirty = (id) => {
  dirtyItems.set(`birthday-${id}`, { type: 'birthday', id })
  queueDirtyProcessing()
}

// debounce so multiple changes within 5000ms (5 secs) get batched
const queueDirtyProcessing = () => {
  if (dirtyTimer) clearTimeout(dirtyTimer)
  dirtyTimer = setTimeout(processDirtyItems, 5000)
}

// update notifications for items marked
const processDirtyItems = async () => {
  await removeDeliveredNotifications()
  if (!dirtyItems.size) return

  const items = Array.from(dirtyItems.values()) //events and students ids -> events and birthdays
  dirtyItems.clear()

  const notifications = []

  for (const item of items) {
    let notification = null
    if (item.type === 'event') { notification = await processDirtyEvent(item.id) }
    if (item.type === 'birthday') { notification = await processDirtyBirthday(item.id) }
    if(notification) notifications.push(notification)
  }

  if(notifications.length) await scheduleNotifications(notifications) // schedules notifications in batch
}

// update notifications for marked events
const processDirtyEvent = async (id) => {
  await cancelNotificationById(id)
  const dataStore = useDataStore()

  const event = dataStore.sortedEvents.find(e => e.id_event === id)
  if (!event) return // event deleted 

  const student = dataStore.sortedStudents.find(s => s.id_student === event.id_student)
  if (!student) return  // student deleted

  // else -> set up a notification
  const config = dataStore.sortedConfig
  const notification = eventNotification(event, student, config)
  
  return notification
  // if (notification) await scheduleNotifications([notification])  // schedules notifications one-by-one
}

// update notifications for marked birthdays
const processDirtyBirthday = async (id) => {
  await cancelNotificationById(id)
  const dataStore = useDataStore()

  const student = dataStore.sortedStudents.find(s => s.id_student === id)
  if (!student || !student.dob) return // student has been deleted or dob is invalid

  const config = dataStore.sortedConfig
  const notification = birthdayNotification(student, config)

  return notification
  // if(notification) await scheduleNotifications([notification])
}

export { markEventDirty, markBirthdayDirty }