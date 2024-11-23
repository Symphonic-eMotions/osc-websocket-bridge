module.exports = {
  content: [
    "./*.html", // Zorg ervoor dat dit pad naar jouw HTML-bestanden verwijst
    "./src/**/*.{js,ts,jsx,tsx}", // Voeg hier extra paden toe voor JavaScript-bestanden als nodig
    './src/server/views/**/*.ejs',
    './src/public/pages/**/*.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
