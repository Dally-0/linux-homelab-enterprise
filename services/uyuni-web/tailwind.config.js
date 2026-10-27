export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        uyuni: {
          white: '#F8FAFC', // Nieve/Sal
          blue: '#0284C7',  // Cielo diurno
          night: '#0F172A', // Cielo nocturno
          earth: '  ', // Desierto
        }
      },
      fontFamily: {
        merriweather: ['"Merriweather"', 'serif'],
      }
    },
  },
  plugins: [],
}