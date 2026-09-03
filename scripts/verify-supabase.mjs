import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env.local')

console.log('\n--- Supabase Connection Diagnostic ---')

if (!fs.existsSync(envPath)) {
  console.log('[STATUS: missing_env]')
  console.log('Reason: .env.local file was not found.')
  console.log('Action: Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n')
  process.exit(0)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach((line) => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...vals] = trimmed.split('=')
    if (key) {
      envVars[key.trim()] = vals.join('=').trim()
    }
  }
})

const url = envVars.VITE_SUPABASE_URL
const key = envVars.VITE_SUPABASE_ANON_KEY

const isPlaceholder =
  !url ||
  !key ||
  url === 'YOUR_SUPABASE_PROJECT_URL' ||
  key === 'YOUR_SUPABASE_PUBLIC_KEY' ||
  !url.startsWith('http')

if (isPlaceholder) {
  console.log('[STATUS: missing_env]')
  console.log('Environment file exists, but credentials are still unconfigured placeholders.')
  console.log(`- VITE_SUPABASE_URL present: ${Boolean(url && url !== 'YOUR_SUPABASE_PROJECT_URL')}`)
  console.log(`- VITE_SUPABASE_ANON_KEY present: ${Boolean(key && key !== 'YOUR_SUPABASE_PUBLIC_KEY')}`)
  console.log('\nTo connect to a live Supabase project:')
  console.log('1. Go to your Supabase Project Settings -> API')
  console.log('2. Replace placeholders in .env.local with your Project URL & anon public key.\n')
  process.exit(0)
}

// Test live connection without any writes or table requirements
try {
  const client = createClient(url, key)
  const { error } = await client.auth.getSession()

  if (error) {
    console.log('[STATUS: error]')
    console.log(`Supabase endpoint responded with error: ${error.message}\n`)
    process.exit(1)
  }

  console.log('[STATUS: connected]')
  console.log('Supabase client initialized and connected successfully!')
  console.log('Safe read check (client.auth.getSession) succeeded with 0 errors.')
  console.log('No database tables were modified or created.\n')
} catch (err) {
  console.log('[STATUS: error]')
  console.log(`Network or host resolution failure: ${err.message}\n`)
  process.exit(1)
}
