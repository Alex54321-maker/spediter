import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // ИМПОРТИРУЕМ ПЛАГИН СТИЛЕЙ

// https://vite.dev
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // АКТИВИРУЕМ КОНВЕЙЕР ТАЙЛВИНДА V4
  ],
})
