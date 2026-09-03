/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F5F3EE",
        surface: "#FFFFFF",
        "surface-soft": "#FAF9F5",
        ink: "#252525",
        "ink-soft": "#686762",
        border: "#DDDAD2",
        beige: "#E9E5DC",
        teal: "#52736F",
        amber: "#B5894A",
        sage: "#71806B",
        terracotta: "#A96961",
      },
      fontFamily: {
        heading: ["DM Sans", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(37, 37, 37, 0.06)",
      },
    },
  },
  plugins: [],
};
