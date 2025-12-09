import { eventNotification, birthdayNotification } from '@/modules/notifications/notificationHelper'
import { scheduleNotifications, cancelNotificationById, removeDeliveredNotifications } from '@/modules/notifications/notificationMain'
import { useDataStore } from '@/stores/dataStore'

const dirtyItems = new Set()
let dirtyTimer = null

// mark events notifications that to be updated
const markEventDirty = (id) => {
  dirtyItems.add({ type: 'event', id })
  queueDirtyProcessing()
}

// mark students notifications that to be updated
const markBirthdayDirty = (id) => {
  dirtyItems.add({ type: 'birthday', id })
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
  
  const items = Array.from(dirtyItems) //events and students ids -> events and birthdays
  dirtyItems.clear()

  for (const item of items) {
    if (item.type === 'event') await processDirtyEvent(item.id)
    if (item.type === 'birthday') await processDirtyBirthday(item.id)
  }
}

// update notifications for marked events
const processDirtyEvent = async (id) => {
  await cancelNotificationById(id)
  const dataStore = useDataStore()

  const event = dataStore.data.events.find(e => e.id_event === id)
  if (!event) return // event deleted 

  const student = dataStore.data.students.find(s => s.id_student === event.id_student)
  if (!student) return  // student deleted

  // else -> set up a notification
  const config = dataStore.data.config
  const notification = eventNotification(event, student, config)
  if (notification) scheduleNotifications([notification])
}

// update notifications for marked birthdays
const processDirtyBirthday = async (id) => {
  await cancelNotificationById(id)
  const dataStore = useDataStore()

  const student = dataStore.data.students.find(s => s.id_student === id)
  if (!student || !student.dob) return // student has been deleted or dob is invalid

  const config = dataStore.data.config
  const notification = birthdayNotification(student, config)
  await scheduleNotifications([notification])
}

export { markEventDirty, markBirthdayDirty }