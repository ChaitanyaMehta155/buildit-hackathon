import { useEffect, useState, useMemo } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthContext } from './authContextDef'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(isSupabaseConfigured && supabase))

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    // 1. Fetch initial active session
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    // 2. Subscribe to auth state updates (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async ({ email, password, fullName, college, phone }) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: { message: 'Supabase is not configured yet.' } }
    }
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          college: college || '',
          phone: phone || '',
        },
      },
    })
  }

  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: { message: 'Supabase is not configured yet.' } }
    }
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) return
    return await supabase.auth.signOut()
  }

  const resetPasswordForEmail = async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: { message: 'Supabase is not configured yet.' } }
    }
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  }

  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: { message: 'Supabase is not configured yet.' } }
    }
    return await supabase.auth.updateUser({
      password: newPassword,
    })
  }

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      signUp,
      signIn,
      signOut,
      resetPasswordForEmail,
      updatePassword,
      isConfigured: isSupabaseConfigured,
    }),
    [session, user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
