// usage: import '@/logger.js'
const DEBUG = true  // import.meta.env.DEV || false
const originalLog = console.log

// reset console log to support tag coloring
console.log = (...args) => {
  if (!DEBUG) return

  const match = args
    .map(arg => typeof arg === 'string'
      ? arg.match(/\[([^\]]*)\] ?/) // matchs '[any string]' or '[any string] '
      : null).find(m => m)

  if (!match) return originalLog(...args)

  // const assignedColors = {}  // use this when specific colors for specific tags is desired

  const tag = match[1]
  const color = setColorTag(tag)  // assignedColors[tag]

  const head = `%c[${tag}]`
  const style = `color: ${color}; font-weight:bold`

  args = args.map(arg => typeof arg === 'string'
    ? arg.replace(/\[[^\]]*\] ?/g, "")
    : arg
  )

  return originalLog(head, style, ...args)
}

// assigns a color to each tag that shows up in the console.log
const createColorTag = () => {
  let colorIndex = 0
  const tagColors = new Map()   // tag -> assigned color
  
  const COLOR_PALETTE = [
    '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
    '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
    '#008080', '#e6beff', '#9A6324', '#fffac8', '#800000',
    '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
  ]

  const findColorTag = (tag) => {
    if (!tagColors.has(tag)) {
      const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]
      tagColors.set(tag, color)
      colorIndex++
    }
    return tagColors.get(tag)
  }

  return findColorTag
}

const setColorTag = createColorTag()

/*
// -- Defining setColorTag() anonymously --
// -> named is better when it comes to legibility, reusability and tracing
// -> makes no difference in terms of performance and tree shaking
// -> for the sake of learning only

const setColorTag = (() => {  // anonymous function
  let colorIndex = 0
  ...
  return tag => {...}         // return anonympus function
})()                          // run anonymous function

*/