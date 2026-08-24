const lang = 'pt-BR'                    // default, pt-BR, en-US, en-GB, fr-FR, de-DE
const displayCurrency = 'BRL'           // default, BRL, USD, GBP, EUR, EUR
const timezone = 'America/Sao_Paulo'    // Temporal.Now.timeZoneId()    // GMT-3    
const weekstart = 1                     // 1: Monday, 7: Sunday

document.documentElement.lang = lang

export { lang, displayCurrency, timezone, weekstart }