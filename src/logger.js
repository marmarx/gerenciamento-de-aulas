// customizing console.log
const DEBUG = true
const consoleColors = {dataStore: 'red', Notification: 'blue'}
const originalLog = console.log

console.log = (...args) => {
  if(!DEBUG) return

  const match = args
    .map(arg => typeof arg === 'string'
      ? arg.match(/\[([^\]]*)\] ?/)
      : null).find(m => m)
      
  if (!match) return originalLog(...args)

  const tag = match[1]

  args = args
    .map(arg => typeof arg === 'string'
      ? arg.replace(/\[[^\]]*\] ?/g, "")
      : arg
  )

  return originalLog(`%c[${tag}]`, `color: ${consoleColors[tag]}; font-weight:bold`, ...args)
}