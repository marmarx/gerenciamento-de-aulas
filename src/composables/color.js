import { watch } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const hue = h => h > 360 ? h - 360 : (h < 0 ? 360 + h : h)
const sl = sl => sl > 1 ? 1 : (sl < 0 ? 0 : sl)

const hexToRgb = hex => {
  const h = hex.replace('#','');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
};

const rgbToHex = ([r,g,b]) => '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');

const rgbToHsl = (r,g,b) => {
  r/=255; g/=255; b/=255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  const d = max-min;
  if (!d) { h = s = 0; }
  else {
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch (max) {
      case r: h = (g-b)/d + (g < b ? 6 : 0); break;
      case g: h = (b-r)/d + 2; break;
      default: h = (r-g)/d + 4;
    }
    h *= 60;
  }
  return [h, s, l];
};

const hslToRgb = (h,s,l) => {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2*l - 1)) * s;
  const x = c * (1 - Math.abs(((h/60) % 2) - 1));
  const m = l - c/2;
  let r=0,g=0,b=0;
  if (h < 60) [r,g,b] = [c,x,0];
  else if (h < 120) [r,g,b] = [x,c,0];
  else if (h < 180) [r,g,b] = [0,c,x];
  else if (h < 240) [r,g,b] = [0,x,c];
  else if (h < 300) [r,g,b] = [x,0,c];
  else [r,g,b] = [c,0,x];
  return [
    Math.round((r+m)*255),
    Math.round((g+m)*255),
    Math.round((b+m)*255),
  ];
};

const paletteFromBase = (baseHex) => {
  const [h0,s0,l0] = rgbToHsl(...hexToRgb(baseHex));
  const [h,s,l] = [hue(h0),sl(s0),sl(l0)]

  const colors = [
    [h,         s,          l],          //--nav-back
    [h,         s,          sl(l-.1)],   //--nav-hover
    [hue(h+30), sl(s-.1),   sl(l+.2)],   //--nav-line
    [hue(h-30), s,          l],          //--header-left
    [hue(h+30), s,          l],          //--header-right
  ].map(([h,s,l]) => rgbToHex(hslToRgb(h,s,l)))

  colors[0] = `${colors[0]}bf`  //add 85% transparency
  const text  = (s < .33 && l > .6) ? 'var(--head-black)' : 'var(--head-white)'

  return [...colors, text]
}

export function useTheme() {
  const dataStore = useDataStore()

  const colorLabels = ['nav-back','nav-hover','nav-line','header-left','header-right','head-text']
  const setCSSVar = (label, color) => document.documentElement.style.setProperty(`--${label}`, color)

  const applyTheme = (baseColor) => {
    const colors = paletteFromBase(baseColor)
    colors.forEach((color, i) => setCSSVar(colorLabels[i], color))
  }

  watch(() => dataStore.data.config.color, applyTheme, { immediate: true, deep: true })

  return { applyTheme }
}
