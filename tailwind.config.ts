/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: "tw-", // avoid conflicts with bootstrap
  important: true, // avoid conflicts with bootstrap
  content: [
    "./inertia/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8f9fa",
        primary: "#0a58ca",
        text: "#343a40",
        "dark-gray": "#212529",
        "light-gray": "#dee2e6",
        "ultra-light-gray": "#f8f9fa",
        "link-blue": "#0058E6",
        "libre-blue": "#127BC4"
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // disable preflight to avoid conflicts with bootstrap
  },
};
// https://stackoverflow.com/questions/62688037/can-use-both-tailwind-css-and-bootstrap-4-at-the-same-time
