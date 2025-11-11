import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { uuidv4, today, dateISO, timeISO } from './utility';
import { paletteFromBase } from './colorStore';
import { importStorage, exportStorage, exportXLSX } from './importExport';
// import dummyData from '@/unpublished/dummyData'

const storageTitle = 'gestaoDeAulas'
const newData = () => (
  {
    students:[], events:[], payments:[], config:
    {
      numberOfDays: 14, autoCreateEvents: true, autoFinishEvents: false, autoFinishOffset: 30, autoRemovePastEvents: false, // agenda settings
      minutesBefore: 15, // notifications settings
      defaultClassDuration: 1, defaultClassCost: 50,  // classes default settings
      color: '#44289e'  // user interface settings
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

  const clearStorage = () => {
    if(!data.value) return;
    const text = `Tem certeza que deseja apagar todos os dados?\n\nAtenção: essa operação não poderá ser desfeita!`
    if(!confirm(text)) return;
    localStorage.removeItem(storageTitle)
    data.value = newData()
    console.log('[dataStore] All data deleted')
  }

  const importData = (evOrCallback, maybeCallback) => {
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
  watch(data,saveStorage,{deep:true})

  const newStudent = () => {
    const student = ref({
      id_student: `student_${uuidv4()}`,
      added_on: new Date(),
      paused: false,
      student_name: '',                     //required
      student_phone: '',
      parent: '', parent_phone: '',
      parent_2: '', parent_2_phone: '',
      address: '',
      meeting: '',
      scholl: '', year: '',
      weekly_schedule: [{ weekDay: null, timeDay: '', subject: '' }], // { weekDay: 0-6, timeDay: 'hh:mm', subject: '' }
      cost: data.value.config.defaultClassCost || 50,
      minutesBefore: data.value.config.minutesBefore || 15,
      start_date: dateISO(today()), end_date: '',
      obs: ''
    })
    return student.value
  }

  const newEvent = () => {
    const event = ref({
      id_event: `event_${uuidv4()}`,
      id_student: '',               //required
      student_name: '',
      added_on: new Date(),
      date: dateISO(today()),       //required
      time: timeISO(today()),       //required
      dateEnd: dateISO(today()),
      timeEnd: timeISO(new Date(new Date().getTime() + (data.value.config.defaultClassDuration || 1) * 60* 60 * 1000)),
      originalDate: '',
      originalTime: '',
      cost: data.value.config.defaultClassCost || 50, //number
      duration: data.value.config.defaultClassDuration || 1,  //hours
      minutesBefore: data.value.config.minutesBefore || 15, //number
      experimental: false, //boolean
      added_manually: true,
      rescheduled: false,
      status: '', //scheduled, done, canceled
      obs: ''
    })
    return event.value
  }

  const newPayment = () => {
    const payment = ref({
      id_pay: `payment_${uuidv4()}`,
      id_student: '',                 //required
      student_name: '',
      added_on: new Date(),
      date: dateISO(today()),         //required
      value: 0,                       //required
      obs: ''
    })
    return payment.value
  }

  // watch(data,() => console.log('[dataStore]', data.value))

  const removeStudent = id => data.value.students.splice(data.value.students.findIndex(s => s.id_student === id), 1)
  const removeEvent   = id => data.value.events  .splice(data.value.events  .findIndex(e => e.id_event === id), 1)
  const removePayment = id => data.value.payments.splice(data.value.payments.findIndex(p => p.id_pay === id), 1)

  const sortedStudents = computed(() => data.value.students.sort((a, b) => a.student_name.toLowerCase().localeCompare(b.student_name.toLowerCase())))
  const sortedEvents   = computed(() => data.value.events  .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)))
  const sortedPayments = computed(() => data.value.payments.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)))

  const activeStudents = computed(() => sortedStudents.value.filter(s => !s.paused))
  const pausedStudents = computed(() => sortedStudents.value.filter(s =>  s.paused))

  const doneEvents   = computed(() => sortedEvents.value.filter(e =>  e.status === 'done'))
  const undoneEvents = computed(() => sortedEvents.value.filter(e =>  e.status !== 'done'))

  const selectedStudent = ref('')
  const selectedEvent   = ref('')
  const selectedPayment = ref('')

  const student         = computed(() => sortedStudents.value.find  (s => s.id_student === selectedStudent.value))
  const studentEvents   = computed(() =>   sortedEvents.value.filter(e => e.id_student === selectedStudent.value))
  const studentPayments = computed(() => sortedPayments.value.filter(p => p.id_student === selectedStudent.value))

  const color_label = ['nav-back','nav-hover','nav-line','header-left','header-right','head-text']
  const color_set = (label,color) => document.documentElement.style.setProperty(`--${label}`, color)

  watch(() => data.value.config.color, (color) => {
    const colors = paletteFromBase(color)
    colors.forEach((color,i) => color_set(color_label[i],color))
  }, { deep: true, immediate: true })

  return { 
    saveStorage, clearStorage,
    importData, exportData, exportTables,
    newStudent, newEvent, newPayment,
    removeStudent, removeEvent, removePayment,
    selectedStudent, selectedEvent, selectedPayment,
    sortedStudents, sortedEvents, sortedPayments,
    activeStudents, pausedStudents,
    doneEvents, undoneEvents,
    student, studentEvents, studentPayments,
    data
  }
});