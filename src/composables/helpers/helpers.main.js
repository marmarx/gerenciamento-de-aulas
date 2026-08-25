const lang = 'pt-BR'                    // default, pt-BR, en-US, en-GB, fr-FR, de-DE
const displayCurrency = 'BRL'           // default, BRL, USD, GBP, EUR, EUR
const timezone = 'America/Sao_Paulo'    // Temporal.Now.timeZoneId()    // GMT-3    
const weekstart = -1                    // -2: Saturday, -1: Sunday, 0: Monday

document.documentElement.lang = lang

export { lang, displayCurrency, timezone, weekstart }