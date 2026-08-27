import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: { extend: { colors: { purple: '#502078', 'purple-dark': '#3A1758', gold: '#D0A068', coral: '#E83828', ink: '#221733', paper: '#F9F7FB' }, fontFamily: { display: ['Georgia', 'serif'], body: ['Trebuchet MS', 'sans-serif'], mono: ['IBM Plex Mono', 'monospace'] } } },
  plugins: [],
};
export default config;
