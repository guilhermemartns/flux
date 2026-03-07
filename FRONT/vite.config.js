import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-bootstrap': ['bootstrap', 'react-bootstrap'],
          'vendor-icons': ['react-feather', 'react-icons', '@fortawesome/react-fontawesome', '@fortawesome/free-solid-svg-icons'],
          'vendor-utils': ['axios', 'sweetalert2', 'react-toastify', 'canvas-confetti'],
        },
      },
    },
  },
})
