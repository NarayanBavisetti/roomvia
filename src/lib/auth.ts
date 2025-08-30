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

// Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Listen to auth changes
export const onAuthStateChange = (callback: (user: AuthUser) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })
}