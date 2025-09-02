'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Loader2, Mail, Phone, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface OTPModalProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  contact: string
  type: 'email' | 'sms'
}

export default function OTPModal({ isOpen, onClose, onBack, contact, type }: OTPModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const { verifyOTP, signInWithEmail, signInWithPhone } = useAuth()

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  // Focus first input on mount
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0]?.focus()
    }
  }, [isOpen])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste scenario
      const pastedData = value.slice(0, 6).split('')
      const newOtp = [...otp]
      pastedData.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit
        }
      })
      setOtp(newOtp)
      
      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(index + pastedData.length, 5)
      inputRefs.current[nextIndex]?.focus()
    } else {
      // Handle single character input
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete verification code')
      return
    }

    setError('')
    setLoading(true)

    try {
      const { error } = await verifyOTP(contact, otpCode, type)
      
      if (error) {
        setError(error.message || 'Invalid verification code. Please try again.')
        // Clear OTP on error
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }

      // Success - modal will close automatically due to auth state change
      onClose()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error('OTP verification error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setLoading(true)
    setCanResend(false)
    setCountdown(30)

    try {
      let result
      if (type === 'email') {
        result = await signInWithEmail(contact)
      } else {
        result = await signInWithPhone(contact)
      }

      if (result.error) {
        setError(result.error.message || 'Failed to resend code. Please try again.')
        setCanResend(true)
        setCountdown(0)
      }
    } catch {
      setError('Failed to resend code. Please try again.')
      setCanResend(true)
      setCountdown(0)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOtp(['', '', '', '', '', ''])
    setError('')
    setLoading(false)
    setCountdown(30)
    setCanResend(false)
    onClose()
  }

  const getContactDisplay = () => {
    if (type === 'email') {
      return contact
    } else {
      // Format phone number for display
      return contact.replace('+91', '+91 ')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] p-0" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-6 w-6 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-2xl font-semibold">Enter Verification Code</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                {type === 'email' ? (
                  <Mail className="h-6 w-6 text-purple-500" />
                ) : (
                  <Phone className="h-6 w-6 text-purple-500" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              We sent a verification code to
            </p>
            <p className="font-semibold text-gray-900 mt-1">
              {getContactDisplay()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-purple-500 hover:bg-purple-800 text-white font-medium"
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>

            <div className="text-center">
              {canResend ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-purple-500 hover:text-purple-800"
                >
                  Resend code
                </Button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend code in {countdown}s
                </p>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}