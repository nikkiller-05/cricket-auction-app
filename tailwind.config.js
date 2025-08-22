/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'batter': '#3B82F6',
        'bowler': '#EF4444',
        'wicket-keeper': '#10B981',
        'allrounder': '#F59E0B',
        'captain': '#8B5CF6',
        'other': '#6B7280'
      }
    },
  },
  plugins: [],
}
