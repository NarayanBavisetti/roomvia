'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Menu, Plus, LogOut, UserIcon, MessageCircle, Home, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useChat } from '@/contexts/chat-context'
import LoginModal from '@/components/auth/login-modal'
import OTPModal from '@/components/auth/otp-modal'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otpContact, setOtpContact] = useState('')
  const [otpType, setOtpType] = useState<'email' | 'sms'>('email')

  const { user, loading, signOut } = useAuth()
  const { toggleSidebar, chatList } = useChat()
  const pathname = usePathname()
  const router = useRouter()
  const isFlatmatesSection = pathname?.startsWith('/flatmates')
  const ctaHref = isFlatmatesSection ? '/flatmates/create-profile' : '/add-listing'
  const ctaLabel = isFlatmatesSection ? 'Add Your Profile' : 'Add Listing'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    // Only add scroll listener on client side
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll)
      const openLogin = () => setShowLoginModal(true)
      window.addEventListener('open-login-modal', openLogin as EventListener)
      return () => {
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('open-login-modal', openLogin as EventListener)
      }
    }
  }, [])

  const handleOTPSent = (contact: string, type: 'email' | 'sms') => {
    setOtpContact(contact)
    setOtpType(type)
    setShowOTPModal(true)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getUserInitials = (user: { email?: string; phone?: string }) => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    if (user?.phone) {
      return user.phone.slice(-2)
    }
    return 'U'
  }

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button 
              onClick={(e) => {
                e.preventDefault()
                router.push('/')
              }}
              className="text-2xl font-bold text-purple-500 cursor-pointer hover:text-purple-800 transition-colors"
            >
              Roomvia
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                router.push('/')
              }}
              className={`group relative px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                pathname === '/' 
                  ? 'text-purple-600' 
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Home className={`h-4 w-4 transition-all duration-300 group-hover:scale-110 ${
                  pathname === '/' ? 'text-purple-600' : 'text-gray-500'
                }`} />
                <span>Flats</span>
              </div>
              {pathname === '/' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-purple-600 rounded-full" />
              )}
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault()
                router.push('/flatmates')
              }}
              className={`group relative px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                pathname?.startsWith('/flatmates') 
                  ? 'text-purple-600' 
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className={`h-4 w-4 transition-all duration-300 group-hover:scale-110 ${
                  pathname?.startsWith('/flatmates') ? 'text-purple-600' : 'text-gray-500'
                }`} />
                <span>Flatmates</span>
              </div>
              {pathname?.startsWith('/flatmates') && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-purple-600 rounded-full" />
              )}
            </button>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="group relative h-9 w-9 hover:bg-gray-100 transition-all duration-300 hover:scale-110 transform"
              >
                <MessageCircle className="h-5 w-5 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" />
                {chatList.reduce((acc, chat) => acc + chat.unread_count, 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {Math.min(chatList.reduce((acc, chat) => acc + chat.unread_count, 0), 9)}
                  </span>
                )}
              </Button>
            )}
            
            <Button
              className="group bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-xl px-4 py-2 transition-all duration-300 hover:shadow-lg hover:scale-105 transform"
              onClick={() => {
                if (user) {
                  router.push(ctaHref)
                } else {
                  setShowLoginModal(true)
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
              {ctaLabel}
            </Button>
            
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-purple-500 text-white text-sm font-medium">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.email && (
                        <p className="font-medium">{user.email}</p>
                      )}
                      {user.phone && !user.email && (
                        <p className="font-medium">{user.phone}</p>
                      )}
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email || user.phone || 'User'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault()
                    router.push('/profile')
                  }}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault()
                    router.push('/saved')
                  }}>
                    <span>Saved</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>My Listings</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                className="font-medium"
                onClick={() => setShowLoginModal(true)}
              >
                Login
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/')
                  setIsMenuOpen(false)
                }}
                className={`group flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 w-full text-left ${
                  pathname === '/' 
                    ? 'text-purple-600' 
                    : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <Home className={`h-4 w-4 transition-all duration-200 group-hover:scale-110 ${
                  pathname === '/' ? 'text-purple-600' : 'text-gray-500'
                }`} />
                <span>Flats</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/flatmates')
                  setIsMenuOpen(false)
                }}
                className={`group flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 w-full text-left ${
                  pathname?.startsWith('/flatmates') 
                    ? 'text-purple-600' 
                    : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <Users className={`h-4 w-4 transition-all duration-200 group-hover:scale-110 ${
                  pathname?.startsWith('/flatmates') ? 'text-purple-600' : 'text-gray-500'
                }`} />
                <span>Flatmates</span>
              </button>
              <div className="block px-3 py-2">
                <Button
                  className="group w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg"
                  onClick={() => {
                    if (user) {
                      router.push(ctaHref)
                    } else {
                      setShowLoginModal(true)
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                  {ctaLabel}
                </Button>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
                {loading ? (
                  <div className="w-full h-8 bg-gray-200 rounded animate-pulse" />
                ) : user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-purple-500 text-white text-sm font-medium">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {user.email || user.phone || 'User'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="group w-full justify-start font-medium transition-all duration-200"
                      onClick={toggleSidebar}
                    >
                      <MessageCircle className="mr-2 h-4 w-4 group-hover:text-purple-600 transition-colors duration-200" />
                      Messages
                      {chatList.reduce((acc, chat) => acc + chat.unread_count, 0) > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {Math.min(chatList.reduce((acc, chat) => acc + chat.unread_count, 0), 9)}
                        </span>
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start font-medium"
                      onClick={(e) => {
                        e.preventDefault()
                        router.push('/profile')
                        setIsMenuOpen(false)
                      }}
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                    <Button variant="ghost" className="w-full justify-start font-medium">
                      My Listings
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start font-medium"
                    onClick={() => setShowLoginModal(true)}
                  >
                    Login
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onOTPSent={handleOTPSent}
      />
      
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onBack={() => {
          setShowOTPModal(false)
          setShowLoginModal(true)
        }}
        contact={otpContact}
        type={otpType}
      />
    </nav>
  )
}