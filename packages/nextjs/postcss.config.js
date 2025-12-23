module.exports = {
  plugins: {
    "@tailwindcss/postcss": {
      // Suppress @property warning - it's a valid CSS feature supported in modern browsers
      // The warning comes from daisyUI's internal CSS and can be safely ignored
      suppressWarnings: ['@property']
    },
  },
};
