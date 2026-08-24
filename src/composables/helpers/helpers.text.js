import { lang, displayCurrency } from './helpers.main'

export const pad = (str) => str.toString().padStart(2, '0')
export const toSentenceCase = str => str.charAt(0).toUpperCase() + str.toLowerCase().slice(1)

export const currency = val => val.toLocaleString(lang, { style: 'currency', currency: displayCurrency })//.replace('-R$','- R$')

export const whatsappLink = phone => phone.trim()   ? `https://wa.me/${phone.replace(/\D/g, '')}` : ''
export const mapsLink   = address => address.trim() ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}` : ''