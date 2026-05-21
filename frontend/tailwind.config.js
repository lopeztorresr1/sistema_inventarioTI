/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Habilita el cambio manual por clase .dark
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores base para el modo oscuro profesional
        dark: {
          bg: '#030712', // Gris casi negro
          card: 'rgba(255, 255, 255, 0.02)', // Glassmorphism
          border: 'rgba(255, 255, 255, 0.05)',
        }
      },
      animation: {
        // Animaciones de entrada suave para los indicadores
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [
    require('tailwindcss-animate'), // Para las clases de entrada que usamos en el dashboard
  ],
}