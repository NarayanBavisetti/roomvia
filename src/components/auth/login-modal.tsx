'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Phone, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onOTPSent: (contact: string, type: 'email' | 'sms') => void
}

export default function LoginModal({ isOpen, onClose, onOTPSent }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signInWithEmail, signInWithPhone } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (activeTab === 'email') {
        if (!email.trim()) {
          setError('Please enter a valid email address')
          return
        }

        const { error } = await signInWithEmail(email)
        if (error) {
          setError(error.message || 'Failed to send email. Please try again.')
          return
        }

        onOTPSent(email, 'email')
      } else {
        if (!phone.trim()) {
          setError('Please enter a valid phone number')
          return
        }

        // Format phone number - ensure it starts with +
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`
        
        const { error } = await signInWithPhone(formattedPhone)
        if (error) {
          setError(error.message || 'Failed to send SMS. Please try again.')
          return
        }

        onOTPSent(formattedPhone, 'sms')
      }

      // Reset form
      setEmail('')
      setPhone('')
      onClose()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setPhone('')
    setError('')
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] p-0" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">Welcome to Roomvia</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Sign in or create an account to get started
          </p>
        </DialogHeader>

        <div className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <TabsContent value="email" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="h-12"
                    disabled={loading}
                    required
                  />
                </div>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter your phone number"
                      className="h-12 pl-12"
                      disabled={loading}
                      maxLength={10}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    We&apos;ll send you an SMS with a verification code
                  </p>
                </div>
              </TabsContent>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Continue with {activeTab === 'email' ? 'Email' : 'Phone'}
                  </>
                )}
              </Button>
            </form>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              &{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}