import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export type AuthUser = User | null

export interface AuthContextType {
  user: AuthUser
  loading: boolean
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>
  verifyOTP: (emailOrPhone: string, token: string, type: 'email' | 'sms') => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

let inFlightUserPromise: Promise<User | null> | null = null

// Fast user getter: prefers cached session, de-dupes network fetches
export const getUserFast = async (): Promise<User | null> => {
  // Try session first (no network)
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) return session.user

  // Fall back to network, but de-duplicate parallel calls
  if (!inFlightUserPromise) {
    inFlightUserPromise = supabase.auth
      .getUser()
      .then(({ data }) => data.user ?? null)
      .finally(() => {
        inFlightUserPromise = null
      })
  }
  return inFlightUserPromise
}

// Sign in with email OTP
export const signInWithEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // You can customize the email template in Supabase dashboard
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}

// Sign in with phone OTP  
export const signInWithPhone = async (phone: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    })
    
    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}

// Verify OTP
export const verifyOTP = async (emailOrPhone: string, token: string, type: 'email' | 'sms') => {
  try {
    let params
    if (type === 'email') {
      params = {
        email: emailOrPhone,
        token,
        type: 'email' as const,
      }
    } else {
      params = {
        phone: emailOrPhone,
        token,
        type: 'sms' as const,
      }
    }
    
    const { error } = await supabase.auth.verifyOtp(params)
    
    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}

// Verify phone OTP
export const verifyPhoneOTP = async (phone: string, token: string) => {
  try {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    
    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Sign out error:', error.message)
  }
}

// Get current user (fast path)
export const getCurrentUser = async () => {
  return getUserFast()
}

// Listen to auth changes
export const onAuthStateChange = (callback: (user: AuthUser) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })
}