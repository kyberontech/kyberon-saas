/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Paleta Kyberon ──────────────────────────────────
        // Mude estas cores para personalizar o tema inteiro
        'ky-bg':       '#060E1A',   // fundo principal
        'ky-panel':    '#0A1628',   // fundo dos cards/painéis
        'ky-border':   '#0F2A4A',   // bordas
        'ky-primary':  '#00C8FF',   // cor principal (azul ciano)
        'ky-blue':     '#0057FF',   // azul escuro
        'ky-green':    '#00FFB3',   // verde (online / ok)
        'ky-red':      '#FF3B3B',   // vermelho (alarme)
        'ky-yellow':   '#FFB800',   // amarelo (aviso)
        'ky-text':     '#C8E8FF',   // texto principal
        'ky-muted':    '#4A7090',   // texto secundário
      },
      fontFamily: {
        // Fontes futurísticas via Google Fonts (carregadas no globals.css)
        head: ['Rajdhani', 'sans-serif'],
        body: ['Exo 2', 'sans-serif'],
      },
      animation: {
        'alarm-blink': 'alarmBlink 0.8s steps(1) infinite',
        'dot-pulse':   'dotPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        alarmBlink: {
          '0%,100%': { boxShadow: '0 0 0 2px #FF3B3B, 0 0 16px rgba(255,59,59,0.5)' },
          '50%':     { boxShadow: '0 0 0 2px rgba(255,59,59,0.2)' },
        },
        dotPulse: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%':     { opacity: '0.3', transform: 'scale(0.6)' },
        },
      },
    },
  },
  plugins: [],
}
