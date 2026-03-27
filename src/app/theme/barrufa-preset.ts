import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

/** Blau Barrufet (#0077F2) — escala per PrimeNG (semantic.primary) */
const barrufetPrimary = {
  50: '#e6f4ff',
  100: '#cce8ff',
  200: '#99d1ff',
  300: '#66baff',
  400: '#339dff',
  500: '#0077f2',
  600: '#005fc4',
  700: '#004896',
  800: '#003068',
  900: '#00183a',
  950: '#000c1d'
};

export const barrufaAuraPreset = definePreset(Aura, {
  semantic: {
    primary: barrufetPrimary
  }
});
