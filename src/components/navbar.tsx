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
import { Menu, Plus, LogOut, UserIcon, MessageCircle } from 'lucide-react'
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
            <Link href="/">
              <h1 className="text-2xl font-bold text-purple-500 cursor-pointer hover:text-purple-800 transition-colors">
                Roomvia
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-purple-500 transition-colors font-medium">
              Flats
            </Link>
            <Link href="/flatmates" className="text-gray-700 hover:text-purple-500 transition-colors font-medium">
              Flatmates
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="relative h-9 w-9 hover:bg-gray-100 transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-gray-600" />
                {chatList.reduce((acc, chat) => acc + chat.unread_count, 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {Math.min(chatList.reduce((acc, chat) => acc + chat.unread_count, 0), 9)}
                  </span>
                )}
              </Button>
            )}
            
            <Button
              className="bg-purple-500 hover:bg-purple-800 text-white font-medium rounded-xl px-4 py-2 transition-colors"
              onClick={() => {
                if (user) {
                  router.push(ctaHref)
                } else {
                  setShowLoginModal(true)
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
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
                  <Link href="/profile">
                    <DropdownMenuItem>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/profile">
                    <DropdownMenuItem>
                      <span>Saved</span>
                    </DropdownMenuItem>
                  </Link>
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
              <Link href="/" className="block px-3 py-2 text-gray-700 hover:text-purple-500 font-medium">
                Flats
              </Link>
              <Link href="/flatmates" className="block px-3 py-2 text-gray-700 hover:text-purple-500 font-medium">
                Flatmates
              </Link>
              <div className="block px-3 py-2">
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-800 text-white font-medium rounded-xl"
                  onClick={() => {
                    if (user) {
                      router.push(ctaHref)
                    } else {
                      setShowLoginModal(true)
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
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
                      className="w-full justify-start font-medium"
                      onClick={toggleSidebar}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Messages
                      {chatList.reduce((acc, chat) => acc + chat.unread_count, 0) > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {Math.min(chatList.reduce((acc, chat) => acc + chat.unread_count, 0), 9)}
                        </span>
                      )}
                    </Button>
                    <Link href="/profile">
                      <Button variant="ghost" className="w-full justify-start font-medium">
                        <UserIcon className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </Link>
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