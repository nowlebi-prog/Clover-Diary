/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Pretendard", "system-ui", "sans-serif"]
      },
      colors: {
        clover: {
          bg: "#F8FAF7",
          primary: "#8DDFA8",
          deep: "#3E8F63",
          mint: "#BFEFE0",
          blue: "#DCEEFF",
          lavender: "#E8E1FF",
          cream: "#FFF8EA",
          coral: "#FFDCD1",
          coralDeep: "#D97757",
          text: "#1F2A24",
          sub: "#7A887F",
          danger: "#F87171",
          warning: "#FBBF24"
        }
      },
      boxShadow: {
        glass: "0 20px 60px rgba(70, 95, 80, 0.08)"
      }
    }
  },
  plugins: []
};
