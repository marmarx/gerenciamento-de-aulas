// usage: import '@/logger.js'
const DEBUG = true  // import.meta.env.DEV || false
const STYLING_ARG_REGEX = /\[([^\]]*)\] ?/; // regex matchs '[any string]' or '[any string] '
const originalLog = console.log

// reset console log to support tag coloring
console.log = (...args) => {
  if (!DEBUG) return

  // const assignedColors = {}  // use this instead when specific colors for specific tags is desired

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    const match = typeof arg === 'string' ? arg.match(STYLING_ARG_REGEX) : null

    if (match) {
      const fullMatch = arg.trim() === match[0].trim()  // is arg '[tag]' or '[tag] string'?
      
      if (fullMatch) args.splice(index, 1)                    // removes the arg match
      else args[index] = arg.replace(STYLING_ARG_REGEX, "")   // removes only tag from the arg match

      const tag   = match[1]
      const color = setColorTag(tag)  // assignedColors[tag]

      const head  = `%c[${tag}]`
      const style = `color: ${color}; font-weight:bold`
      args.unshift(head, style)

      break // only the first tag match is import
    }
  }

  return originalLog(...args)
}

// assigns a color to each tag that shows up in the console.log
const createColorTag = () => {
  let colorIndex = 0
  const tagColors = new Map()   // map for assigned color
  
  const COLOR_PALETTE = [
    '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
    '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
    '#008080', '#e6beff', '#9A6324', '#fffac8', '#800000',
    '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
  ]

  const findColorTag = (tag) => {
    if (!tagColors.has(tag)) {
      const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]
      tagColors.set(tag, color) // tag -> assign color
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