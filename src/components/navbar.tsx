'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Menu, Plus, LogOut, UserIcon, MessageCircle, Bell, Home, Users, Heart, FileText, Settings, BarChart3 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useChat } from '@/contexts/chat-context'
import LoginModal from '@/components/auth/login-modal'
import OTPModal from '@/components/auth/otp-modal'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  // const [isScrolled, setIsScrolled] = useState(false) // Removed - not needed since navbar scrolls naturally
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otpContact, setOtpContact] = useState('')
  const [otpType, setOtpType] = useState<'email' | 'sms'>('email')
  // const [hideForFilters, setHideForFilters] = useState(false) // Removed - letting navbar scroll naturally

  const { user, loading, signOut } = useAuth()
  const { toggleSidebar, chatList } = useChat()
  const pathname = usePathname()
  const router = useRouter()
  const isFlatmatesSection = pathname?.startsWith('/flatmates')
  const ctaHref = isFlatmatesSection ? '/flatmates/create-profile' : '/add-listing'
  const ctaLabel = 'Add' // Consistent CTA label to avoid layout shifts
  const [isBroker, setIsBroker] = useState(false)
  const totalUnread = useMemo(() => chatList.reduce((acc, chat) => acc + chat.unread_count, 0), [chatList])

  useEffect(() => {
    // Only add login modal listener on client side
    if (typeof window !== 'undefined') {
      const openLogin = () => setShowLoginModal(true)
      window.addEventListener('open-login-modal', openLogin as EventListener)
      return () => {
        window.removeEventListener('open-login-modal', openLogin as EventListener)
      }
    }
  }, [])

  // Remove the navbar hiding behavior - let it scroll naturally
  // useEffect(() => {
  //   const onSticky = (e: any) => {
  //     try {
  //       const sticky = Boolean(e?.detail?.sticky)
  //       setHideForFilters(sticky)
  //     } catch {
  //       // no-op
  //     }
  //   }
  //   if (typeof window !== 'undefined') {
  //     window.addEventListener('filters-sticky-change', onSticky as EventListener)
  //     return () => window.removeEventListener('filters-sticky-change', onSticky as EventListener)
  //   }
  // }, [])

  // Check if current user is a broker to show Analytics tab
  useEffect(() => {
    const checkBroker = async () => {
      if (!user) {
        setIsBroker(false)
        return
      }
      try {
        const { data } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .maybeSingle()
        setIsBroker((data as { account_type?: string })?.account_type === 'broker')
      } catch {
        setIsBroker(false)
      }
    }
    checkBroker()
  }, [user])

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
    <nav className="w-full bg-white/95 backdrop-blur-sm  z-50">
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

          {/* Desktop Right Group: utilities (icons) → primary CTA → avatar */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Utility icons */}
            <div className="flex items-center space-x-2">
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  aria-label="Open messages"
                  className="group relative h-11 w-11 rounded-full bg-white border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <MessageCircle className="h-5 w-5 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" />
                  {totalUnread > 0 && (
                    <>
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500/40 animate-ping" />
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center z-10">
                        {Math.min(totalUnread, 9)}
                      </span>
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                onClick={() => router.push('/notifications')}
                className="group relative h-11 w-11 rounded-full bg-white border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Bell className="h-5 w-5 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" />
                <span className="sr-only">Notifications</span>
              </Button>
            </div>

            {/* Primary CTA: consistent Add dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={ctaLabel}
                  className="group relative bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-full px-5 h-11 transition-all duration-300 shadow-sm hover:shadow-lg border-0 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-out"></div>
                  <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                  <span className="relative z-10">{ctaLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    if (user) router.push('/add-listing'); else setShowLoginModal(true)
                  }}
                  className="cursor-pointer"
                >
                  Add Listing
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (user) router.push('/flatmates/create-profile'); else setShowLoginModal(true)
                  }}
                  className="cursor-pointer"
                >
                  Add Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
 
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="group relative h-11 w-11 rounded-full p-0 hover:scale-105 transition-all duration-300">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-sm font-bold group-hover:from-purple-600 group-hover:to-purple-700 transition-all duration-300">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-purple-500/20 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-2xl rounded-2xl p-2">
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl mb-2">
                    <Avatar className="h-8 w-8 border-2 border-white shadow-md flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs font-bold">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none flex-1 min-w-0">
                      {user.email && (
                        <p className="font-semibold text-gray-900 text-sm truncate">{user.email}</p>
                      )}
                      {user.phone && !user.email && (
                        <p className="font-semibold text-gray-900 text-sm">{user.phone}</p>
                      )}
                      <p className="text-xs text-purple-600 font-medium">
                        Active user
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-200/50 my-2" />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault()
                      router.push('/profile')
                    }}
                    className="group rounded-lg px-2 py-2 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 focus:bg-gradient-to-r focus:from-purple-50 focus:to-purple-100/50"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="p-1.5 rounded-md bg-blue-50 group-hover:bg-blue-100 transition-colors">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-800 group-hover:text-gray-900 text-sm">Profile</span>
                    </div>
                  </DropdownMenuItem>
                  {isBroker && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault()
                        router.push('/broker/analytics')
                      }}
                      className="group rounded-lg px-2 py-2 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 focus:bg-gradient-to-r focus:from-purple-50 focus:to-purple-100/50"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="p-1.5 rounded-md bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                          <BarChart3 className="h-4 w-4 text-yellow-600" />
                        </div>
                        <span className="font-medium text-gray-800 group-hover:text-gray-900 text-sm">Broker Analytics</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault()
                      router.push('/insights')
                    }}
                    className="group rounded-lg px-2 py-2 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 focus:bg-gradient-to-r focus:from-purple-50 focus:to-purple-100/50"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="p-1.5 rounded-md bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                        <BarChart3 className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="font-medium text-gray-800 group-hover:text-gray-900 text-sm">{isBroker ? 'Market Insights' : 'Insights'}</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault()
                      router.push('/saved')
                    }}
                    className="group rounded-lg px-2 py-2 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 focus:bg-gradient-to-r focus:from-purple-50 focus:to-purple-100/50"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="p-1.5 rounded-md bg-red-50 group-hover:bg-red-100 transition-colors">
                        <Heart className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="font-medium text-gray-800 group-hover:text-gray-900 text-sm">Saved</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault()
                      router.push('/my-listings')
                    }}
                    className="group rounded-xl px-3 py-3 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 focus:bg-gradient-to-r focus:from-purple-50 focus:to-purple-100/50"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="p-1.5 rounded-md bg-green-50 group-hover:bg-green-100 transition-colors">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium text-gray-800 group-hover:text-gray-900 text-sm">My Listings</span>
                    </div>
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem className="group rounded-xl px-3 py-3 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 focus:bg-gradient-to-r focus:from-purple-50 focus:to-purple-100/50">
                    <div className="flex items-center gap-2 w-full">
                      <div className="p-1.5 rounded-md bg-gray-50 group-hover:bg-gray-100 transition-colors">
                        <Settings className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-800 group-hover:text-gray-900 text-sm">Settings</span>
                    </div>
                  </DropdownMenuItem> */}
                  <DropdownMenuSeparator className="bg-gray-200/50 my-2" />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="group rounded-xl px-3 py-3 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 focus:bg-gradient-to-r focus:from-red-50 focus:to-red-100/50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-red-50 group-hover:bg-red-100 transition-colors">
                          <LogOut className="h-4 w-4 text-red-600" />
                        </div>
                        <span className="font-medium text-red-600 group-hover:text-red-700 text-sm">Sign out</span>
                      </div>
                    </div>
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
                  className="group relative w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-2xl py-3 h-12 transition-all duration-300 hover:shadow-lg overflow-hidden"
                  onClick={() => {
                    if (user) {
                      router.push(ctaHref)
                    } else {
                      setShowLoginModal(true)
                    }
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
                  <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                  <span className="relative z-10">{ctaLabel}</span>
                </Button>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
                {loading ? (
                  <div className="w-full h-8 bg-gray-200 rounded animate-pulse" />
                ) : user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Avatar className="h-9 w-9 border-2 border-purple-200 shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-sm font-bold">
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
                      className="group w-full justify-start font-medium transition-all duration-200 hover:bg-purple-50 rounded-lg"
                      onClick={toggleSidebar}
                    >
                      <MessageCircle className="mr-3 h-4 w-4 group-hover:text-purple-600 transition-colors duration-200" />
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
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start font-medium"
                      onClick={() => {
                        setIsMenuOpen(false)
                        router.push('/my-listings')
                      }}
                    >
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