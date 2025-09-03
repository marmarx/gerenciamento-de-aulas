import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { uuidv4, today, dateISO, timeISO, weekDays } from './utility';
import { paletteFromBase } from './colorStore';
// import dummyData from './dummyData'

const storageTitle = 'gestaoDeAulas'
const newData = () => (
  {
    students:[], events:[], payments:[], config:
    {
      numberOfDays: 14, defaultClassDuration: 1, defaultClassCost: 50,
      autoFinishEvents: false, autoRemovePastEvents: false, color: '#44289e',
    }
  }
)

export const useDataStore = defineStore(storageTitle, () => {
  const saveStorage = () => {
    console.log('--- Data saved in localStorage ---')
    localStorage.setItem(storageTitle, JSON.stringify(data.value))
  }

  const loadStorage = () => {
    try{console.log('--- Data loaded from localStorage ---'); return JSON.parse(localStorage.getItem(storageTitle)) || newData()}
    catch(error){console.error('--- Error parsing localStorage! ---\n',error); return newData()}
  }

  const clearStorage = () => {
    if(!data.value) return;
    const text = `Tem certeza que deseja apagar todos os dados?\n\nAtenção: essa operação não poderá ser desfeita!`
    if(!confirm(text)) return;
    data.value = newData()
    localStorage.removeItem(storageTitle)
    console.log('--- All data deleted ---')
  }

  const exportStorage = () => {
    const content = JSON.stringify(data.value, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup.json';
    a.click();
  }

  const importStorage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => data.value = JSON.parse(reader.result)
    reader.readAsText(file);
  }

  const exportTSV = () => {
    Object.entries(data.value).forEach(([key, value]) => {
      if (!Array.isArray(value) || value.length === 0 || key === 'config') return

      // Get headers from object keys
      const headers = Object.keys(value[0])

      // Build TSV content
      // const rows = value.map(obj => headers.map(h => String(obj[h] ?? "")).join("\t"))
      const rows = value.map(obj =>
        headers.map(h => {
          const cell = obj[h]

          // If property is an array of objects, join values
          if (Array.isArray(cell) && cell.every(item => typeof item === "object")) {
            return cell
              .map(item => {
                if ("weekDay" in item && "timeDay" in item) return `${weekDays[item.weekDay]} ${item.timeDay}`
                return Object.values(item).join(" ")
              }).join(", ")
          }

          return String(cell ?? "")
        }).join("\t")
      )

      const tsvContent = [headers.join("\t"), ...rows].join("\n")

      // Create and download file
      const blob = new Blob([tsvContent], { type: "text/tab-separated-values" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${key}.tsv`
      link.click()
      URL.revokeObjectURL(url)
    })
  }

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
      originalDate: '',
      originalTime: '',
      duration: data.value.config.defaultClassDuration || 1,  //hours
      cost: data.value.config.defaultClassCost || 50, // number
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

  const removeStudent = id => data.value.students.splice(data.value.students.findIndex(s => s.id_student === id), 1)
  const removeEvent = id => data.value.events.splice(data.value.events.findIndex(e => e.id_event === id), 1)
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
  const studentEvents   = computed(() => sortedEvents.value.filter  (e => e.id_student === selectedStudent.value))
  const studentPayments = computed(() => sortedPayments.value.filter(p => p.id_student === selectedStudent.value))

  const color_label = ['nav-back','nav-hover','nav-line','header-left','header-right','head-text']
  const color_set = (label,color) => document.documentElement.style.setProperty(`--${label}`, color)

  watch(() => data.value.config.color, (color) => {
    const colors = paletteFromBase(color)
    colors.forEach((color,i) => color_set(color_label[i],color))
  }, { deep: true, immediate: true })

  return { 
    saveStorage, clearStorage, exportStorage, importStorage, exportTSV,
    newStudent, newEvent, newPayment, removeStudent, removeEvent, removePayment,
    selectedStudent, selectedEvent, selectedPayment,
    sortedStudents, sortedEvents, sortedPayments,
    activeStudents, pausedStudents,
    doneEvents, undoneEvents,
    student, studentEvents, studentPayments,
    data
  }
});