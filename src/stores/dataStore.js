import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { uuidv4, dateISO } from '@/composables/utility';
import { importStorage, exportStorage, exportXLSX } from '@/composables/importExport';
import { toastShow } from '@/modules/toast/toastShow'
// import dummyData from '@/unpublished/dummyData'

// -- STORE SETUP --
const storageTitle = 'gestaoDeAulas'

const defaults = {
  cost: 50, duration: 1, variableCost: true,  // classes default settings
  chargeCancelation: false, freeCancelationBefore: 1, cancelationFee: 50,  // cancelation policy
  minutesBefore: 15, // notifications settings
}

const newData = () => (
  {
    students:[], events:[], payments:[],
    config: {
      numberOfDays: 14, autoCreateEvents: true, autoFinishEvents: false, autoFinishOffset: 30, autoRemovePastEvents: false, removalGraceHours: 48, // agenda settings
      color: '#44289e', canceledOnReport: true, advancedOptions: false, notifyBirthday: true, notBirthDayBefore: true, lastRefreshDate: null, // user interface settings
      ...defaults
    }
  }
)

export const useDataStore = defineStore(storageTitle, () => {

  const saveStorage = () => {
    console.log('[dataStore] Data saved in localStorage')
    localStorage.setItem(storageTitle, JSON.stringify(data.value))
  }

  const loadStorage = () => {
    try{console.log('[dataStore] Data loaded from localStorage'); return JSON.parse(localStorage.getItem(storageTitle)) || newData()}
    catch(error){console.error('[dataStore] Error parsing localStorage!\n',error); return newData()}
  }

  const clearStorage = async () => {
    if(!data.value) return;

    const ok = await toastShow('Apagar todos os dados?', 'Esta ação não pode ser desfeita.', true)
    if(!ok) return

    localStorage.removeItem(storageTitle)
    data.value = newData()
    toastShow(null,'Todos os dados apagados')
  }

  const importData = (evOrCallback, maybeCallback) => {
    localStorage.removeItem(storageTitle) // kill storage before importing to avoid data collision
    importStorage(evOrCallback, (content) => {
      data.value = content
      if (typeof maybeCallback === 'function') maybeCallback()
    })
  }

  const exportData    = async () => await exportStorage(data.value)
  const exportTables  = async () => await exportXLSX   (data.value)

  const data = ref()

  data.value = loadStorage()
  // data.value = dummyData;
  watch(data, saveStorage, {deep:true})
  // watch(data, () => console.log(data.value), {deep:true})

  const newStudent = () => {
    const student = {
      id_student: `student_${uuidv4()}`,
      added_on: new Date().getTime(),
      paused: false,
      student_name: '',               //required
      student_phone: '',
      dob: '',
      parent: '', parent_phone: '',
      parent_2: '', parent_2_phone: '',
      address: '',
      meeting: '',
      scholl: '', year: '',
      weekly_schedule: [{ weekDay: null, timeDay: '', subject: '' }], // { weekDay: 0-6, timeDay: 'hh:mm', subject: '' }
      start_date: dateISO(new Date()), end_date: '',
      obs: '',

      cost: data.value.config.cost ?? 50,
      duration: data.value.config.duration || 1,
      variableCost: data.value.config.variableCost || true,

      chargeCancelation: data.value.config.chargeCancelation || false,
      freeCancelationBefore: data.value.config.freeCancelationBefore || 1,
      cancelationFee: data.value.config.cancelationFee || 50,

      minutesBefore: data.value.config.minutesBefore || 15,
    }
    return student
  }

  const newEvent = () => {
    const event = {
      id_event: `event_${uuidv4()}`,
      id_student: '',                 //required
      student_name: '',
      subject: '',
      added_on: new Date().getTime(),
      originalDate: '',
      originalTime: '',
      date: '',       // dateISO(new Date()) - required
      time: '',       // timeISO(new Date()) - required
      dateEnd: '',    // dateISO(new Date())
      timeEnd: '',    // timeISO(new Date().getTime() + (data.value.config.duration || 1) * 60* 60 * 1000)
      experimental: false,
      added_manually: true,
      rescheduled: false,
      status: '',     //scheduled, done, canceled
      canceledAt: null,
      obs: '',
      ...defaults
    }
    return event
  }
  
  const newPayment = () => {
    const payment = {
      id_pay: `payment_${uuidv4()}`,
      id_student: '',                 //required
      student_name: '',
      added_on: new Date().getTime(),
      date: dateISO(new Date()),      //required
      value: 0,                       //required
      obs: ''
    }
    return payment
  }

  const removeStudent = id => data.value.students.splice(data.value.students.findIndex(s => s.id_student === id), 1)
  const removeEvent   = id => data.value.events  .splice(data.value.events  .findIndex(e => e.id_event === id), 1)
  const removePayment = id => data.value.payments.splice(data.value.payments.findIndex(p => p.id_pay === id), 1)

  const selectedStudent = ref('')
  const selectedEvent   = ref('')
  const selectedPayment = ref('')

  const student         = computed(() => data.value.students.find  (s => s.id_student === selectedStudent.value))
  const studentEvents   = computed(() => data.value.events  .filter(e => e.id_student === selectedStudent.value))
  const studentPayments = computed(() => data.value.payments.filter(p => p.id_student === selectedStudent.value))

  const sortedStudents = computed(() => [...data.value.students].sort((a, b) => a.student_name.toLowerCase().localeCompare(b.student_name.toLowerCase())))
  const sortedPayments = computed(() => [...data.value.payments].sort((a, b) => a.date.localeCompare(b.date)))
  const sortedEvents   = computed(() => [...data.value.events]
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .filter(e => !e.deleted)
  )
  const sortedConfig   = computed(() => ({...data.value.config}))

  const activeStudents = computed(() => sortedStudents.value.filter(s => !s.paused))
  const pausedStudents = computed(() => sortedStudents.value.filter(s =>  s.paused))

  const scheduledEvents = computed(() => sortedEvents.value.filter(e => e.status === 'scheduled'))
  const canceledEvents  = computed(() => sortedEvents.value.filter(e => e.status === 'canceled'))
  const doneEvents      = computed(() => sortedEvents.value.filter(e => e.status === 'done'))
  const undoneEvents    = computed(() => sortedEvents.value.filter(e => e.status !== 'done'))       //scheduled + canceled -> agenda
  
  // events may individually be charged, each may have it's own chargeCancelation policy
  const chargableEvents = computed(() => {
    const predicate = (e) => e.chargeCancelation ? e.status !== 'scheduled' : e.status === 'done'
    return sortedEvents.value.filter(predicate)
  })

  return { 
    saveStorage, clearStorage,
    importData, exportData, exportTables,
    newStudent, newEvent, newPayment,
    removeStudent, removeEvent, removePayment,
    selectedStudent, selectedEvent, selectedPayment,
    sortedStudents, sortedEvents, sortedPayments, sortedConfig,
    activeStudents, pausedStudents,
    scheduledEvents, doneEvents, canceledEvents, undoneEvents, chargableEvents,
    student, studentEvents, studentPayments,
    data
  }
})