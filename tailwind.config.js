/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        transparent: "transparent",
        current: "currentColor",
        indicator: "#3f8ae2",
        base: {
          // background
          100: "rgb(var(--color-base-100) / <alpha-value>)",
          200: "rgb(var(--color-base-200) / <alpha-value>)",
          300: "rgb(var(--color-base-300) / <alpha-value>)",
          400: "rgb(var(--color-base-400) / <alpha-value>)",
        },
        content: {
          // foreground
          100: "rgb(var(--color-content-100) / <alpha-value>)",
          200: "rgb(var(--color-content-200) / <alpha-value>)",
          300: "rgb(var(--color-content-300) / <alpha-value>)",
          400: "rgb(var(--color-content-400) / <alpha-value>)",
        },
        neutral: {
          // divide
          100: "rgb(var(--color-neutral-100) / <alpha-value>)",
          200: "rgb(var(--color-neutral-200) / <alpha-value>)",
          300: "rgb(var(--color-neutral-300) / <alpha-value>)",
          400: "rgb(var(--color-neutral-400) / <alpha-value>)",
        },
        primary: {
          // button background
          100: "rgb(var(--color-primary-100) / <alpha-value>)", // default
          200: "rgb(var(--color-primary-200) / <alpha-value>)", // hover
        },
        "primary-content": {
          // button foreground
          100: "rgb(var(--color-primary-content-100) / <alpha-value>)", // default
          200: "rgb(var(--color-primary-content-200) / <alpha-value>)", // hover
        },
        danger: {
          // button background
          100: "rgb(var(--color-danger-100) / <alpha-value>)", // default
          200: "rgb(var(--color-danger-200) / <alpha-value>)", // hover
        },
        "danger-content": {
          // button foreground
          100: "rgb(var(--color-danger-content-100) / <alpha-value>)", // default
          200: "rgb(var(--color-danger-content-200) / <alpha-value>)", // hover
        },
      },
    },
  },
}
