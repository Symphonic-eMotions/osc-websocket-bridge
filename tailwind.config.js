module.exports = {
  content: [
    './src/server/views/**/*.ejs', // Voor alle EJS-views in server/views
    './src/public/pages/**/*.html', // Voor HTML-bestanden in public/pages
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'), // Plugin voor aspect-ratio
  ],
};
