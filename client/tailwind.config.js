/** @type {import('tailwindcss').Config} */


export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      extend: {
        backgroundImage: {
          'dotted': 'radial-gradient(circle, white 1px, transparent 1px)',
        },
},
    },
    plugins: [],
  }
  
  