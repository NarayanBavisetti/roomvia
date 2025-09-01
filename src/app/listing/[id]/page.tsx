'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import {
  ArrowLeft,
  MapPin,
  Home,
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
  Heart,
  HeartOff
} from 'lucide-react'

interface ListingDetail {
  id: string
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
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  
  const listingId = params?.id as string

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
        } catch (_) {
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

  const handlePreviousImage = () => {
    if (!listing?.images?.length) return
    setCurrentImageIndex(prev => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    )
  }

  const handleNextImage = () => {
    if (!listing?.images?.length) return
    setCurrentImageIndex(prev => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    )
  }

  const handleChatClick = () => {
    if (!user) {
      // Redirect to login
      router.push('/auth/login')
      return
    }
    // TODO: Implement chat functionality
    console.log('Starting chat with listing owner')
  }

  const toggleLike = () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    setIsLiked(!isLiked)
    // TODO: Implement save/unsave functionality
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          text: `Check out this property: ${listing?.title}`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // TODO: Show toast notification
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
  const currentImage = images[currentImageIndex]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images and Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="relative">
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-200">
                  {images.length > 0 && currentImage ? (
                    <Image
                      src={currentImage.url}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Image Navigation */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePreviousImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Image Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                      <button
                        key={image.public_id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex ? 'border-purple-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt={`${listing.title} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Title and Location */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {listing.title}
                    </h1>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{listing.city}, {listing.state}, {listing.country}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleLike}
                      className="text-gray-600 hover:text-red-500"
                    >
                      {isLiked ? <Heart className="h-4 w-4 fill-red-500 text-red-500" /> : <HeartOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="text-gray-600"
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Property Type and Status */}
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="secondary" className="text-purple-700 bg-purple-100">
                    {listing.property_type}
                  </Badge>
                  <Badge 
                    variant={listing.status === 'active' ? 'default' : 'secondary'}
                    className={listing.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                  </Badge>
                  <Badge variant="outline" className="text-gray-600">
                    {listing.user_type === 'broker' ? 'Posted by Broker' : 'Posted by Owner'}
                  </Badge>
                </div>
              </div>

              {/* Property Details */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Property Details</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    {listing.area_sqft && (
                      <div className="flex items-center text-gray-600">
                        <Maximize className="h-5 w-5 mr-2" />
                        <span>{listing.area_sqft} sq.ft</span>
                      </div>
                    )}
                    {listing.floor && (
                      <div className="flex items-center text-gray-600">
                        <Building2 className="h-5 w-5 mr-2" />
                        <span>Floor {listing.floor}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-5 w-5 mr-2" />
                      <span>Available Now</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  {listing.highlights && listing.highlights.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {listing.highlights.map((highlight, index) => (
                          <Badge key={index} variant="outline" className="text-gray-700">
                            <Check className="h-3 w-3 mr-1" />
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {listing.description && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">Description</h4>
                      <p className="text-gray-700 leading-relaxed">
                        {listing.description}
                      </p>
                    </div>
                  )}

                  {/* Flatmate Preferences */}
                  {listing.flatmate_preferences && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Flatmate Preferences</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Gender:</span> {listing.flatmate_preferences.gender}
                        </div>
                        <div>
                          <span className="font-medium">Smoking:</span> {listing.flatmate_preferences.smoker ? 'Allowed' : 'Not Allowed'}
                        </div>
                        <div>
                          <span className="font-medium">Food:</span> {listing.flatmate_preferences.food}
                        </div>
                        <div>
                          <span className="font-medium">Pets:</span> {listing.flatmate_preferences.pets ? 'Allowed' : 'Not Allowed'}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Expenses */}
              {listing.expenses && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-3">Additional Information</h3>
                    <p className="text-gray-700">{listing.expenses}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Pricing and Contact */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Pricing Card */}
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center text-3xl font-bold text-gray-900 mb-2">
                        <IndianRupee className="h-8 w-8" />
                        {listing.rent.toLocaleString('en-IN')}
                        <span className="text-lg font-normal text-gray-600 ml-1">/month</span>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      {listing.maintenance > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Maintenance:</span>
                          <span>₹{listing.maintenance.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>Security Deposit:</span>
                        <span>₹{listing.security_deposit.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between font-semibold text-gray-900">
                          <span>Total Move-in Cost:</span>
                          <span>₹{(listing.rent + listing.security_deposit + listing.maintenance).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button 
                        onClick={handleChatClick}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        size="lg"
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Start Chat
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        size="lg"
                        onClick={() => window.open(`tel:${listing.contact_number}`)}
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        {listing.contact_number}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Owner Info */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="relative w-12 h-12 rounded-full bg-gray-200 mr-4">
                        {listing.profiles?.avatar_url ? (
                          <Image
                            src={listing.profiles.avatar_url}
                            alt={listing.profiles.full_name || 'Owner'}
                            fill
                            className="object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-purple-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {listing.profiles?.full_name || 'Property Owner'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {listing.user_type === 'broker' ? 'Verified Broker' : 'Property Owner'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Shield className="h-4 w-4 mr-2" />
                      <span>Verified Contact</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Safety Tips */}
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-6">
                    <h4 className="font-medium text-yellow-800 mb-2">Safety Tips</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Always visit the property before making payment</li>
                      <li>• Verify owner identity and property documents</li>
                      <li>• Don&apos;t share personal/financial info via chat</li>
                      <li>• Meet in public places when possible</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}