import { Capacitor } from '@capacitor/core'
const isNative = Capacitor.isNativePlatform()

import * as XLSX from 'xlsx'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { FilePicker } from '@capawesome/capacitor-file-picker'
import { currency, dateISO, longWeekdays } from '@/composables/utility'
import { eventValue, eventCancelPolicy } from '@/composables/eventValue'

// helper function
const fileDate = () => new Date().toLocaleDateString('en-CA').replaceAll('-', '.')
const blobToBase64 = (blob) => new Promise((resolve) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result.split(',')[1])
  reader.readAsDataURL(blob)
})

/* ## IMPORT: pick and load backup json file ## */
const importStorage = async (eOrOnDone, maybeOnDone) => {
  
  let onDone, event;
  if (typeof eOrOnDone === 'function') onDone = eOrOnDone // Native call: only callback passed
  else {  // Web call: file input event + callback
    event = eOrOnDone
    onDone = maybeOnDone
  }

  // Web version - no need to ask for permission
  if (!isNative) {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const json = JSON.parse(reader.result)
      if (typeof onDone === 'function') onDone(json)
    }
    reader.readAsText(file)
    return
  }

  // Native (Capacitor)
  try {
    const result = await FilePicker.pickFiles({
      types: ['application/json'],
      presentationStyle: 'fullscreen',
      multiple: false,
      copyToCacheDirectory: true, // ensures readable copy - access to downloads throught cache - no permission required
    })

    if (!result?.files?.length) return
    const file = result.files[0]
    const { data: fileData } = await Filesystem.readFile({ path: file.path })
    console.log('[importStorage] fileData:', fileData)

    // Try parsing directly first, else decode Base64
    let jsonText
    try {
      jsonText = JSON.parse(fileData) // works if plain JSON
    } catch {
      const decoded = decodeURIComponent(escape(atob(fileData)))
      jsonText = JSON.parse(decoded) // works if Base64
    }
    console.log('[importStorage] jsonText:', jsonText)

    if (typeof onDone === 'function') onDone(jsonText)
  }

  catch (err) { console.error('[importStorage] Import failed', err) }
}

/* ## EXPORT: create and share backup json file ## */
const exportStorage = async (data) => {
  const content = JSON.stringify(data, null, 2)
  if (!content) return

  const filename = `${fileDate()} - backup.json`
  const blob = new Blob([content], { type: 'application/json' })
  
  // Web version
  if (!isNative) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    return
  }

  // Native (Capacitor)
  console.log('[exportStorage] Starting export')
  try { 
    const result = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,  // app-private and permission-free
      encoding: Encoding.UTF8,
    })
    console.log('[exportStorage] File written to:', result)
    await Share.share({
      title: 'Gestão de Aulas - Backup Dados',
      text: 'Backup de todos os dados',
      url: result.uri,
      dialogTitle: 'Compartilhe o arquivo de backup',
    })
    console.log('[exportStorage] Share invoked')
  }
  catch (err) { console.error('[exportStorage] Export failed', err) }
}

/* ## EXPORT: create and share backup XLSX file ## */
const prepareData = (data) => {
  const preparedData = { Alunos:[], Aulas:[], Pagamentos:[] }

  data.students.forEach(s => {
    const newStudent = {
      'Id': s.id_student,
      'Nome': s.student_name,
      'Status': s.paused ? 'Pausado' : 'Ativo',
      'Telefone': s.student_phone,
      'Data de Nascimento': s.dob,
      'Escola': s.school,
      'Ano': s.year,
      'Nome do Responsável': s.parent,
      'Telefone do Responsável': s.parent_phone,
      'Nome do Responsável 2': s.parent_2,
      'Telefone do Responsável 2': s.parent_2_phone,
      'Endereço': s.address,
      'Início de contrato': s.start_date,
      'Fim de contrato': s.end_date,
      'Horários semanais': s.weekly_schedule,
      'Adicionado em': dateISO(s.added_on),
      'Observações': s.obs
    }
    preparedData.Alunos.push(newStudent)
  })

  data.events.forEach(e => {
    const newEvent = {
      'Id Aluno': e.id_student,
      'Aluno': e.student_name,
      'Data de início': e.date,
      'Horário de início': e.time,
      'Data de fim': e.dateEnd,
      'Horário de fim': e.timeEnd,
      'Valor unitário': e.cost,
      'Duração': e.duration,
      'Política de precificação': e.variableCost ? 'por hora' : 'fixo',
      'Política de cancelamento': eventCancelPolicy(e.id_event),
      'Experimental': e.experimental ? 'Sim' : 'Não',
      'Valor total': currency(eventValue(e.id_event)),
      'Tipo de agendamento': e.added_manually ? 'Manual' : 'Automático',
      'Adicionada em': dateISO(e.added_on),
      'Remarcado': e.rescheduled ? 'Sim' : 'Não',
      'Data original': e.originalDate,
      'Horário original': e.originalTime,
      'Status': e.status === 'scheduled' ? 'Agendada' : (e.status === 'done' ? 'Finalizada' : 'Cancelada'),
      'Cancelado em': e.canceledAt ? dateISO(e.canceledAt) : 'Não cancelado',
      'Observações': e.obs
    }
    if(e.subject) newEvent['Matéria'] = e.subject
    preparedData.Aulas.push(newEvent)
  })

  data.payments.forEach(p => {
    const newPayment = {
      'Id Aluno': p.id_student,
      'Aluno': p.student_name,
      'Data': p.date,
      'Valor': p.value,
      'Adicionado em': dateISO(p.added_on),
      'Observações': p.obs
    }
    preparedData.Pagamentos.push(newPayment)
  })

  return preparedData
}

const exportXLSX = async (data) => {
  const preparedData = prepareData(data)

  const workbook = XLSX.utils.book_new()
  const filename = `${fileDate()} - backup.xlsx`

  // Create one sheet per dataset
  for (const [key, value] of Object.entries(preparedData)) {
    if (!Array.isArray(value) || value.length === 0 || key === 'config') continue

    // Preprocess rows to handle arrays of objects
    const transformed = value.map(obj => {
      const newObj = {}
      for (const [prop, cell] of Object.entries(obj)) {
        if (Array.isArray(cell) && cell.every(item => typeof item === "object")) {
          // Join nested object values as in TSV
          newObj[prop] = cell
            .map((item, key) => {
              if ("weekDay" in item && "timeDay" in item) {
                if (typeof item.weekDay === 'number') return `${longWeekdays[item.weekDay]} ${item.timeDay}`
                return null
              }
              return Object.values(item).join(" ")
            })
            .filter(Boolean).join(", ")
        }
        // else if (prop === 'added_on' || prop === 'canceledAt') newObj[prop] = cell ? new Date(cell).toISOString().slice(0,19).replace('T',' ') : ''
        else newObj[prop] = cell ?? "" // fallback to empty string
      }
      return newObj
    })

    const sheet = XLSX.utils.json_to_sheet(transformed)
    XLSX.utils.book_append_sheet(workbook, sheet, key.slice(0, 31))
  }

  // Web version
  if (!isNative) {
    XLSX.writeFile(workbook, filename)
    return
  }

  // Native (Capacitor)
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const base64 = await blobToBase64(blob)

  try {
    const result = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    })
    await Share.share({
      title: 'Gestão de Aulas - Dados Exportados',
      text: 'Dados exportados em formato Excel',
      url: result.uri,
      dialogTitle: 'Compartilhe a planilha exportada',
    })
  }
  catch (err) { console.error('[exportXLSHandler] Export failed:', err) }
}

export { importStorage, exportStorage, exportXLSX }