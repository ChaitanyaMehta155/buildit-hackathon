import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Determines if valid credentials have been supplied (not empty and not placeholder)
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_PUBLIC_KEY' &&
  supabaseUrl.startsWith('http')
)

// Export a single client instance (or null if unconfigured to prevent runtime crash)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

/**
 * Safe development-only connection diagnostic.
 * Does not create tables, does not write data, does not expose credentials.
 *
 * Distinguishes between:
 * 1. 'missing_env' - VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing/placeholder
 * 2. 'connected'   - Client initialized and connected to Supabase endpoint
 * 3. 'error'       - Network failure or invalid project endpoint
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured) {
    return {
      status: 'missing_env',
      message: 'Supabase environment variables are missing or set to placeholder values in .env.local',
      details: {
        hasUrl: Boolean(supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL'),
        hasKey: Boolean(supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_PUBLIC_KEY'),
      },
    }
  }

  try {
    // Safe read: checks connection to Supabase auth service without touching tables or mutating state
    const { error } = await supabase.auth.getSession()

    if (error) {
      return {
        status: 'error',
        message: `Supabase returned an error: ${error.message}`,
      }
    }

    return {
      status: 'connected',
      message: 'Supabase client initialized and connected successfully.',
    }
  } catch (err) {
    return {
      status: 'error',
      message: `Network/Connection error: ${err.message || 'Unable to reach Supabase endpoint'}`,
    }
  }
}
