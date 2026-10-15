/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        kiora: {
          abyssal: "#011C40",
          midnight: "#023859",
          twilight: "#26658C",
          cerulean: "#54ACBF",
          cyan: "#A7EBF2",
        }
      },
      fontFamily: {
        lora: ["Lora_400Regular"],
        "lora-semibold": ["Lora_600SemiBold"],
        jakarta: ["PlusJakartaSans_400Regular"],
        "jakarta-medium": ["PlusJakartaSans_500Medium"],
        "jakarta-semibold": ["PlusJakartaSans_600SemiBold"],
        "jakarta-bold": ["PlusJakartaSans_700Bold"],
      }
    },
  },
  plugins: [],
};
