import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // MapLibre loads its rendering worker as a module at runtime. Keeping it out of
  // Vite's pre-bundled dependency cache preserves that worker module reference.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  plugins: [react()],
})
