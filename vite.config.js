import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  console.log(
    '[Vercel Env Check - process.env]',
    'URL:', Boolean(process.env.VITE_SUPABASE_URL),
    'URL length:', process.env.VITE_SUPABASE_URL?.length ?? 0,
    'KEY:', Boolean(process.env.VITE_SUPABASE_ANON_KEY),
    'KEY length:', process.env.VITE_SUPABASE_ANON_KEY?.length ?? 0
  )

  console.log(
    '[Vercel Env Check - loadEnv]',
    'URL:', Boolean(env.VITE_SUPABASE_URL),
    'URL length:', env.VITE_SUPABASE_URL?.length ?? 0,
    'KEY:', Boolean(env.VITE_SUPABASE_ANON_KEY),
    'KEY length:', env.VITE_SUPABASE_ANON_KEY?.length ?? 0
  )

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
