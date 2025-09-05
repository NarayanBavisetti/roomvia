'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import ImageGallery from '@/components/image-gallery'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { useChat } from '@/contexts/chat-context'
import {
  ArrowLeft,
  MapPin,
  Maximize,
  Building2,
  IndianRupee,
  Shield,
  Phone,
  MessageCircle,
  Calendar,
  User,
  Check,
  ChevronLeft,
  ChevronRight,
  Share,
  Bookmark
} from 'lucide-react'

interface ListingDetail {
  id: string
  user_id: string
  title: string
  property_type: string
  city: string
  state: string
  country: string
  area_sqft: number
  floor: number
  description: string
  highlights: string[]
  rent: number
  maintenance: number
  security_deposit: number
  expenses: string
  flatmate_preferences: {
    gender: string
    smoker: boolean
    food: string
    pets: boolean
  }
  contact_number: string
  images: Array<{
    url: string
    public_id: string
    is_primary: boolean
  }>
  status: string
  created_at: string
  updated_at: string
  user_type: string
  profiles?: {
    full_name: string
    avatar_url?: string
  }
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { openChat } = useChat()
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setCurrentImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  
  const listingId = params?.id as string

  // Check if listing is saved when component loads
  useEffect(() => {
    const checkSaveStatus = async () => {
      if (!user || !listingId) {
        setIsLiked(false)
        return
      }
      try {
        const { savesApi } = await import('@/lib/saves')
        const saved = await savesApi.isSaved('flat', listingId)
        setIsLiked(saved)
      } catch (error) {
        console.error('Error checking save status:', error)
        setIsLiked(false)
      }
    }
    checkSaveStatus()
  }, [user, listingId])

  useEffect(() => {
    if (!listingId) return

    const fetchListing = async () => {
      try {
        setLoading(true)
        
        // Fetch listing first (no embedded join needed)
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        if (!data) {
          throw new Error('Listing not found')
        }
        // Optionally fetch the owner's profile separately
        let profiles: { full_name: string; avatar_url?: string } | undefined
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', data.user_id)
            .single()
          if (profileData) {
            profiles = profileData
          }
        } catch {
          // Ignore profile errors and proceed with listing only
        }

        setListing({ ...data, profiles })
      } catch (err) {
        console.error('Error fetching listing:', err)
        setError(err instanceof Error ? err.message : 'Failed to load listing')
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [listingId])

  const handleToggleSave = async () => {
    if (!user) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open-login-modal'))
      }
      return
    }
    if (saving || !listingId) return
    
    setSaving(true)
    const previous = isLiked
    try {
      // Optimistic UI update
      setIsLiked(!previous)
      const { savesApi } = await import('@/lib/saves')
      const { saved, error } = await savesApi.toggleSave('flat', listingId)
      if (error) {
        console.error('Save toggle failed:', error)
        setIsLiked(previous)
      } else {
        setIsLiked(saved)
      }
    } catch (e) {
      console.error('Save toggle failed:', e)
      setIsLiked(previous)
    } finally {
      setSaving(false)
    }
  }


  // Autoplay for image slideshow
  useEffect(() => {
    if (!listing?.images || listing.images.length <= 1) return
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % listing.images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [listing?.images])

  const handleChatClick = () => {
    if (!user) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open-login-modal'))
      }
      return
    }
    if (listing?.user_id) {
      openChat(listing.user_id, `listing_${listing.id}`, listing.id)
    }
  }

  // Use handleToggleSave instead of toggleLike

  const handleShare = async () => {
    const url = window.location.href
    const title = listing?.title || 'Check out this property'
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(url)
        console.log('Link copied to clipboard')
      } catch (err) {
        console.error('Failed to copy link', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="aspect-video bg-gray-300 rounded-xl mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-20 bg-gray-300 rounded"></div>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <div className="bg-gray-300 rounded-xl h-96"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {error === 'Listing not found' ? 'Listing Not Found' : 'Error Loading Listing'}
              </h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/')}>
                Go to Home
              </Button>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const images = listing.images || []

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span className="text-sm">Back to Listings</span>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column - Images and Details */}
            <div className="lg:col-span-3 space-y-5">
              {/* Collage Image Gallery */}
              <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <ImageGallery images={images.map(img => img.url)} alt={listing.title} />
              </div>

              {/* Lightbox */}
              <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent className="bg-black/95 border-0 p-0 w-[95vw] h-[90vh] max-w-[95vw]">
                  <div className="relative w-full h-full">
                    {images.length > 0 && (
                      <Image src={images[lightboxIndex]?.url || images[0].url} alt={listing.title} fill className="object-contain" />
                    )}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setLightboxIndex(prev => (prev - 1 + images.length) % images.length)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-3 rounded-full hover:bg-white/30"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => setLightboxIndex(prev => (prev + 1) % images.length)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-3 rounded-full hover:bg-white/30"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                        <div className="absolute bottom-4 right-4 bg-white/10 text-white px-3 py-1 rounded-full text-sm">
                          {lightboxIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Property Title and Location */}
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                      {listing.title}
                    </h1>
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-1.5" />
                      <span>{listing.city}, {listing.state}, {listing.country}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleSave}
                      className="text-gray-400 hover:text-purple-600 p-2 h-8 w-8"
                    >
                      <Bookmark className={`h-4 w-4 ${isLiked ? 'text-purple-600 fill-current' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="text-gray-400 hover:text-gray-600 p-2 h-8 w-8"
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Property Type and Status */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs px-2.5 py-1 rounded-full">
                    {listing.property_type}
                  </Badge>
                  <Badge 
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      listing.status === 'active' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs px-2.5 py-1 rounded-full">
                    {listing.user_type === 'broker' ? 'Broker' : 'Owner'}
                  </Badge>
                </div>
              </div>

              {/* Property Details */}
              <div className="bg-white rounded-lg border border-gray-100">
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Property Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    {listing.area_sqft && (
                      <div className="flex items-center text-gray-600 text-sm">
                        <div className="p-2 bg-gray-50 rounded-lg mr-3">
                          <Maximize className="h-4 w-4" />
                        </div>
                        <span>{listing.area_sqft} sq.ft</span>
                      </div>
                    )}
                    {listing.floor && (
                      <div className="flex items-center text-gray-600 text-sm">
                        <div className="p-2 bg-gray-50 rounded-lg mr-3">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span>Floor {listing.floor}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600 text-sm">
                      <div className="p-2 bg-green-50 rounded-lg mr-3">
                        <Calendar className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Available Now</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  {listing.highlights && listing.highlights.length > 0 && (
                    <div className="mb-5">
                      <h4 className="font-medium text-gray-900 mb-3 text-sm">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {listing.highlights.map((highlight, index) => (
                          <Badge key={index} className="bg-green-50 text-green-700 border-green-200 text-xs px-2.5 py-1 rounded-full">
                            <Check className="h-3 w-3 mr-1" />
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {listing.description && (
                    <div className="mb-5">
                      <h4 className="font-medium text-gray-900 mb-3 text-sm">Description</h4>
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {listing.description}
                      </p>
                    </div>
                  )}

                  {/* Flatmate Preferences */}
                  {listing.flatmate_preferences && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 text-sm">Flatmate Preferences</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-xs">
                          <span className="font-medium text-gray-700">Gender:</span>
                          <span className="text-gray-600 ml-1">{listing.flatmate_preferences.gender}</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-medium text-gray-700">Smoking:</span>
                          <span className="text-gray-600 ml-1">{listing.flatmate_preferences.smoker ? 'Allowed' : 'Not Allowed'}</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-medium text-gray-700">Food:</span>
                          <span className="text-gray-600 ml-1">{listing.flatmate_preferences.food}</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-medium text-gray-700">Pets:</span>
                          <span className="text-gray-600 ml-1">{listing.flatmate_preferences.pets ? 'Allowed' : 'Not Allowed'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Expenses */}
              {listing.expenses && (
                <div className="bg-white rounded-lg border border-gray-100 p-5">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Additional Information</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{listing.expenses}</p>
                </div>
              )}
            </div>

            {/* Right Column - Pricing and Contact */}
            <div className="lg:col-span-2">
              <div className="sticky top-20 space-y-4">
                {/* Pricing Card */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
                  <div className="p-5">
                    <div className="text-center mb-5">
                      <div className="flex items-center justify-center text-2xl font-bold text-gray-900 mb-1">
                        <IndianRupee className="h-6 w-6" />
                        {listing.rent.toLocaleString('en-IN')}
                        <span className="text-sm font-normal text-gray-500 ml-1">/month</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-5">
                      {listing.maintenance > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Maintenance:</span>
                          <span className="font-medium text-gray-900">₹{listing.maintenance.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Security Deposit:</span>
                        <span className="font-medium text-gray-900">₹{listing.security_deposit.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between font-semibold text-gray-900 text-sm">
                          <span>Total Move-in Cost:</span>
                          <span>₹{(listing.rent + listing.security_deposit + listing.maintenance).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Button 
                        onClick={handleChatClick}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-sm py-2.5 rounded-lg"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Start Chat
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={handleToggleSave}
                          disabled={saving}
                          className={`border-gray-200 text-sm py-2.5 rounded-lg transition-colors ${
                            isLiked 
                              ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {saving ? (
                            <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Bookmark className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current text-purple-700' : ''}`} />
                          )}
                          {isLiked ? 'Saved' : 'Save'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleShare}
                          className="border-gray-200 text-gray-700 hover:bg-gray-50 text-sm py-2.5 rounded-lg"
                        >
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 text-sm py-2.5 rounded-lg"
                        onClick={() => window.open(`tel:${listing.contact_number}`)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {listing.contact_number}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="bg-white rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center mb-3">
                    <div className="relative w-10 h-10 rounded-full bg-gray-200 mr-3">
                      {listing.profiles?.avatar_url ? (
                        <Image
                          src={listing.profiles.avatar_url}
                          alt={listing.profiles.full_name || 'Owner'}
                          fill
                          className="object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">
                        {listing.profiles?.full_name || 'Property Owner'}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {listing.user_type === 'broker' ? 'Verified Broker' : 'Property Owner'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <Shield className="h-3.5 w-3.5 mr-2 text-green-600" />
                    <span>Verified Contact</span>
                  </div>
                </div>

                {/* Safety Tips */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2 text-sm">Safety Tips</h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Always visit the property before making payment</li>
                    <li>• Verify owner identity and property documents</li>
                    <li>• Don&apos;t share personal/financial info via chat</li>
                    <li>• Meet in public places when possible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}