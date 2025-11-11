import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') // ensures it reads from .env

  return {
    base: '/ai-career-coach/', // 👈 must match your GitHub repo name
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // Safely inject API keys for frontend use
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // cleaner imports like '@/components'
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // set true if you want source maps for debugging
    },
  }
})
