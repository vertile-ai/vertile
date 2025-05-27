/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: {
    relative: true,
    files: [
      './src/**/*.{js,jsx,ts,tsx}',
      './src/*.{jsx,tsx}',
      './src/App.tsx',
      './index.html',
      './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
      './app/**/*.{js,jsx,ts,tsx}',
    ],
  },
  theme: {
    extend: {
      rotate: {
        270: '270deg',
        360: '360deg',
      },
      colors: {
        primary: {
          25: '#f5f8ff',
          50: '#eff4ff',
          100: '#d1e0ff',
          200: '#b2ccff',
          300: '#84adff',
          400: '#528bff',
          500: '#2970ff',
          600: '#155eef',
          700: '#004eeb',
          800: '#0040c1',
          900: '#00359e',
        },
        blue: {
          500: '#E1EFFE',
        },
        black: {
          DEFAULT: '#000000',
          900: '#141414',
        },
        green: {
          50: '#F3FAF7',
          100: '#DEF7EC',
          800: '#03543F',
        },
        yellow: {
          100: '#FDF6B2',
          800: '#723B13',
        },
        purple: {
          50: '#F6F5FF',
          200: '#DCD7FE',
        },
        indigo: {
          25: '#F5F8FF',
          50: '#EEF4FF',
          100: '#E0EAFF',
          300: '#A4BCFD',
          400: '#8098F9',
          500: '#6366f1',
          600: '#444CE7',
          800: '#2D31A6',
        },
        accent: '#3D4147',
        'sidebar-button': '#31353A',

        'main-base': '#24303C',
        'main-workspace': '#2E3A46',
        'main-dark': '#1F2933',
        'main-menu': '#3D4B56',
        'main-text': '#BFCAD4',
        'main-blue': '#4F7ED4',
        'workflow-gray': '#475467',
        blue350: '#4A7AD6',
        'main-nile-blue': '#518C99',
        'main-gray': '#A1ACBD',
        gray320: '#A6B2BD',
        'main-lightgray': '#727E8A',
        'main-white': '#F9FCFC',
        'main-orange': '#D7C692',
        'icon-inactive': '#7C8690',

        'panel-blue': '#B3D7F4',
        'historical-msg-system': 'rgba(255, 255, 255, 0.05);',
        'historical-msg-user': '#2C2F35',
        outline: '#4E5153',
        dashboard: '#f7fafa',
        'sidebar-logo-active': '#5f27cd',
        'header-logo-static': '#737b85',
        'main-log-white': '#B8C7E0',
        'main-log-lightblue': '#97D8F4',
        divline: '#eef4fa',
        'main-title': '#404b58',
        'pipeline-highlight': '#455166',
      },
      backgroundImage: {
        'preference-gradient':
          'linear-gradient(180deg, #5A5C63 0%, rgba(90, 92, 99, 0.28) 100%);',
        'chat-msg-user-gradient':
          'linear-gradient(180deg, #3D4147 0%, #1b2638 100%);',
        'selected-preference-gradient':
          'linear-gradient(180deg, #313236 0%, rgba(63.40, 64.90, 70.13, 0) 100%);',
        'main-gradient': 'linear-gradient(180deg, #3D4059 0%, #1b2638 100%)',
        'main-white-gradient':
          'linear-gradient(to bottom right, #F4F9FF, #D3D7E4)',
        'modal-gradient': 'linear-gradient(180deg, #3D4147 0%, #1b2638 100%)',
        'sidebar-gradient': 'linear-gradient(90deg, #5B616A 0%, #3F434B 100%)',
        'login-gradient': 'linear-gradient(180deg, #3D4147 0%, #1b2638 100%)',
        'menu-item-gradient':
          'linear-gradient(90deg, #3D4147 0%, #1b2638 100%)',
        'menu-item-selected-gradient':
          'linear-gradient(90deg, #5B616A 0%, #1b2638 100%)',
        'workspace-item-gradient':
          'linear-gradient(90deg, #3D4147 0%, #1b2638 100%)',
        'workspace-item-selected-gradient':
          'linear-gradient(90deg, #5B616A 0%, #3F434B 100%)',
        'switch-selected': 'linear-gradient(146deg, #5B616A 0%, #3F434B 100%)',
      },
      fontFamily: {
        sans: [
          'plus-jakarta-sans',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      animation: {
        sweep: 'sweep 0.5s ease-in-out',
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'bottom left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'bottom left' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeOut: {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
      },
    },
  },
  // Required for rechart styles to show since they can be rendered dynamically and will be tree-shaken if not safe-listed.
  safelist: [
    {
      pattern:
        /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
  ],
  plugins: [],
};
