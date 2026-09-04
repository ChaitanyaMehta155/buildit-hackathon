import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
      ),
    },
    build: {
      rollupOptions: {
        output: {
          // Vite 8 uses Rolldown which requires manualChunks as a function
          manualChunks(id) {
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('react-router') || id.includes('react-router-dom')) return 'vendor-router'
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor-react'
          },
        },
      },
    },
  }
})
