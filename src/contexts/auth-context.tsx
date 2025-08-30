'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  AuthContextType, 
  AuthUser, 
  signInWithEmail, 
  signInWithPhone, 
  verifyOTP as verifyOTPUtil,
  verifyPhoneOTP,
  signOut as signOutUtil,
  getCurrentUser,
  onAuthStateChange 
} from '@/lib/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    getCurrentUser().then((user) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await signOutUtil()
    setUser(null)
  }

  const verifyOTP = async (emailOrPhone: string, token: string, type: 'email' | 'sms') => {
    if (type === 'sms') {
      return await verifyPhoneOTP(emailOrPhone, token)
    } else {
      return await verifyOTPUtil(emailOrPhone, token, type)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmail,
    signInWithPhone,
    verifyOTP,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // Return a default state instead of throwing error
    return {
      user: null,
      loading: false,
      signInWithEmail: async () => ({ error: new Error('Auth not initialized') }),
      signInWithPhone: async () => ({ error: new Error('Auth not initialized') }),
      verifyOTP: async () => ({ error: new Error('Auth not initialized') }),
      signOut: async () => {},
    }
  }
  return context
}