import { Capacitor } from '@capacitor/core'
const isNative = Capacitor.isNativePlatform()

import * as XLSX from 'xlsx'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { longWeekdays } from '@/composables/utility';

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
const exportXLSX = async (data) => {
  const workbook = XLSX.utils.book_new()
  const filename = `${fileDate()} - backup.xlsx`

  // Create one sheet per dataset
  for (const [key, value] of Object.entries(data)) {
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
        else if (prop === 'added_on' || prop === 'canceledAt') newObj[prop] = cell ? new Date(cell).toISOString().slice(0,19).replace('T',' ') : ''  //added this line
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