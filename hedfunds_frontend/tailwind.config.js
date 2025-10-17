/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
    content: [
      "./index.html", 
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // Primary Colors
          blue: {
            DEFAULT: '#1A73E8', // Bright Blue
            dark: '#0056D2', // Dark Blue
          },
       
          // Secondary Colors
          gray: {
            dark: '#2B2B2B', // Dark Gray for backgrounds
            light: '#E8E8E8', // Light Gray for borders or dividers
          },
  
          white: '#FFFFFF', // Pure White for text or backgrounds
  
          // Accent Colors
          gold: '#FFB300', // Gold for highlights
          green: {
            DEFAULT: '#22C55E', // Green for success or wallet balances
          },
        },
        fontFamily: {
          title: [
            '"Roboto Condensed"', 'sans-serif',
          ],
          body: [
            '"Special Gothic Expanded One"', 'sans-serif',
          ],
        }
        
      },
    },
    plugins: [],
  };