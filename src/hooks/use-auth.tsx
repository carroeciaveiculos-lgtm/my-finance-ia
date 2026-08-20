import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError, SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const rawClient = supabase as unknown as SupabaseClient

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    nome?: string,
  ) => Promise<{ error: AuthError | Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>
  signOut: () => Promise<{ error: AuthError | Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await rawClient.from('profiles').select('*').eq('id', userId).maybeSingle()

      if (data) {
        setProfile(data as Profile)
      }
    } catch {
      // Ignora erro de busca em fallback
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    rawClient.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = rawClient.auth.onAuthStateChange((_event, currentSession) => {
      // FORBIDDEN: Sem async/await dentro deste callback
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, nome?: string) => {
    try {
      const { data, error } = await rawClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: nome || email.split('@')[0],
            name: nome || email.split('@')[0],
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) return { error }

      if (data.user) {
        if (nome) {
          await rawClient.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            nome: nome,
          })
        }
        await fetchProfile(data.user.id)
      }
      return { error: null }
    } catch (err: unknown) {
      return { error: err as Error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await rawClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return { error }

      if (data.user) {
        await fetchProfile(data.user.id)
      }

      return { error: null }
    } catch (err: unknown) {
      return { error: err as Error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await rawClient.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
      return { error }
    } catch (err: unknown) {
      return { error: err as Error }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
