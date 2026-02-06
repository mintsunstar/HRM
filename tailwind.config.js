/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // BDGen 디자인 시스템 컬러
        brand: {
          500: '#0065FA',
          400: '#24ACFF',
        },
        accent: {
          300: '#00F2FF',
        },
        dark: {
          'bg-950': '#01040e',
          'bg-900': '#020617',
          'surface-850': 'rgba(15,23,42,.92)',
          'surface-800': 'rgba(15,23,42,.78)',
          'line-700': '#444444',
          'line-600': '#444444',
          'text-100': '#F9FAFB',
          'text-200': '#E0F2FE',
          'text-400': 'rgba(226,232,240,.72)',
          // 기존 호환성
          bg: '#020617',
          surface: 'rgba(15,23,42,.92)',
          card: 'rgba(15,23,42,.92)',
          border: '#444444',
          text: '#F9FAFB',
          'text-secondary': 'rgba(226,232,240,.72)',
        },
        // 상태 컬러
        status: {
          normal: 'rgba(34,197,94,.12)',
          'normal-border': 'rgba(34,197,94,.22)',
          late: 'rgba(245,158,11,.12)',
          'late-border': 'rgba(245,158,11,.22)',
          absent: 'rgba(239,68,68,.12)',
          'absent-border': 'rgba(239,68,68,.22)',
          miss: 'rgba(59,130,246,.12)',
          'miss-border': 'rgba(59,130,246,.22)',
        },
      },
      borderRadius: {
        'bdg-18': '10px',
        'bdg-14': '10px',
        'bdg-12': '10px',
        'bdg-10': '10px',
      },
      boxShadow: {
        'bdg': '0 18px 60px rgba(0,0,0,.45)',
        'bdg-glow': '0 0 35px rgba(0, 150, 255, 0.55)',
        'bdg-glow-sm': '0 0 18px rgba(37, 99, 235, 0.9)',
      },
      fontFamily: {
        'bdg': ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', 'sans-serif'],
      },
      backdropBlur: {
        'bdg': '12px',
      },
    },
  },
  plugins: [],
}


