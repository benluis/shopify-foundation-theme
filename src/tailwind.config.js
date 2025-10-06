/**
 * Tailwind CSS configuration file
 *
 * docs: https://tailwindcss.com/docs/configuration
 * default: https://github.com/tailwindcss/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 */
const path = require('path')

module.exports = {
  theme: {
    screens: {
      'sm': '490px',    // Shopify small mobile landscape
      'md': '768px',    // Shopify tablet
      'lg': '1040px',   // Shopify desktop
      'xl': '1440px',   // Shopify large desktop
    },
    extend: {},
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',      // 16px on mobile like iLumkb
        'sm': '1rem',         // Stay consistent on small screens  
        'md': '1.5rem',       // 24px on tablet
        'lg': '2rem',         // 32px on desktop
        'xl': '2.5rem',       // 40px on large desktop
      }
    }
  },
  plugins: [],
  content: [
    path.resolve(__dirname, '**/*.{js,vue}'),
    path.resolve(__dirname, '../shopify/**/*.liquid')
  ]
}