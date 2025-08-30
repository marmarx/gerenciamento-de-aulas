import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { uuidv4, today, dateISO, timeISO } from './utility';
import dummyData from './dummyData'

const storageTitle = 'gestaoDeAulas'
const newData = () => (
  {
    students:[], events:[], payments:[], config:
    {
      numberOfDays: 14, defaultClassDuration: 1,
      color1: '#44289e', color2: '#d02377',
      autoFinishEvents: false, autoRemovePastEvents: false,
    }
  }
)

export const useDataStore = defineStore(storageTitle, () => {
  const saveStorage = () => {
    console.log('--- Data saved in localStorage ---')
    console.log(data.value)
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

  const data = ref()
  data.value = loadStorage()
  // data.value = dummyData;
  watch(data,saveStorage,{deep:true})

  const newStudent = () => {
    const student = ref({
      id_student: `student_${uuidv4()}`,
      added_on: Date.now(),
      paused: false,
      student_name: '',                     //required
      parent: '', parent_phone: '',
      parent_2: '', parent_2_phone: '',
      address: '',
      meeting: '',
      scholl: '', year: '',
      weekly_schedule: [{ weekDay: null, timeDay: '', subject: '' }], // { weekDay: 0-6, timeDay: 'hh:mm', subject: '' }
      cost: 50,
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
      added_on: Date.now(),
      date: dateISO(today()),       //required
      time: timeISO(today()),       //required
      originalDate: '',
      originalTime: '',
      duration: 1,  //hours
      cost: 0,
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
      added_on: Date.now(),
      date: dateISO(today()),         //required
      value: 0,                       //required
      obs: ''
    })
    return payment.value
  }

  const removeStudent = id => data.value.students.splice(data.value.students.findIndex(s => s.id_student === id), 1)
  const removeEvent = id => data.value.events.splice(data.value.events.findIndex(e => e.id_event === id), 1)
  const removePayment = id => data.value.payments.splice(data.value.payments.findIndex(p => p.id_pay === id), 1)

  const selectedStudent = ref(null)
  const selectedEvent = ref(null)
  const selectedPayment = ref(null)

  watch(selectedStudent, () => console.log('Selected student:', selectedStudent.value))
  watch(selectedEvent, () => console.log('Selected event:', selectedEvent.value))
  watch(selectedPayment, () => console.log('Selected payment:', selectedPayment.value))

  return { 
    saveStorage, clearStorage, exportStorage, importStorage, 
    newStudent, newEvent, newPayment, removeStudent, removeEvent, removePayment, 
    data, selectedStudent, selectedEvent, selectedPayment
  }
});