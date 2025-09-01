const clamp01 = x => Math.min(1, Math.max(0, x));

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

function paletteFromBase(baseHex) {
  const [h0,s0,l0] = rgbToHsl(...hexToRgb(baseHex));

  const hover = [h0, s0, l0];
  const main  = [h0 + 50.87, clamp01(s0 * 1.357), clamp01(l0 + 0.208)];
  const back  = [h0 +  3.80, clamp01(s0 * 1.435), clamp01(l0 + 0.108)]; 
  const focus = [h0 -  0.39, clamp01(s0 * 1.257), clamp01(l0 - 0.043)];

  const colors = [main, back, hover, focus].map(([h,s,l]) => rgbToHex(hslToRgb(h,s,l)))
  colors[1] = `${colors[1]}d9`
  const text  = (s0 < .33 && l0 > .6) ? 'var(--black)' : 'var(--white)'

  return [colors, text]
}

export { paletteFromBase }
