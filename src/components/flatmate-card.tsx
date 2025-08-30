'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Building2, 
  Heart, 
  Wifi, 
  Car, 
  Dumbbell,
  Waves,
  Home,
  Shield,
  Wind,
  Coffee,
  TreePine,
  Utensils
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useChat } from '@/contexts/chat-context'
import type { Flatmate } from '@/lib/supabase'

interface FlatmateCardProps {
  flatmate: Flatmate
  onConnect?: () => void
}

const amenityIcons: Record<string, React.ReactElement> = {
  'WiFi': <Wifi className="h-3 w-3" />,
  'Parking': <Car className="h-3 w-3" />,
  'Gym': <Dumbbell className="h-3 w-3" />,
  'Swimming Pool': <Waves className="h-3 w-3" />,
  'Clubhouse': <Home className="h-3 w-3" />,
  'Security': <Shield className="h-3 w-3" />,
  'Lift': <Wind className="h-3 w-3" />,
  'Balcony': <TreePine className="h-3 w-3" />,
  'Laundry': <Coffee className="h-3 w-3" />
}

const getFoodIcon = (preference: string) => {
  switch (preference) {
    case 'Veg':
      return <div className="w-3 h-3 bg-green-500 rounded-sm border border-green-600" />
    case 'Non-Veg':
      return <div className="w-3 h-3 bg-red-500 rounded-sm border border-red-600" />
    case 'Vegan':
      return <div className="w-3 h-3 bg-amber-500 rounded-sm border border-amber-600" />
    default:
      return <Utensils className="h-3 w-3" />
  }
}

export default function FlatmateCard({ flatmate, onConnect }: FlatmateCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const { user } = useAuth()
  const { openChat } = useChat()

  // Mock flatmate data - in real app this would be the actual user
  const flatmateEmail = `${flatmate.name.toLowerCase().replace(' ', '.')}@example.com`

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      // Open login modal globally if not authenticated
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open-login-modal'))
      }
      return
    }
    
    // Use the flatmate ID as the user ID for chat
    openChat(flatmate.id, flatmateEmail)
    onConnect?.()
  }

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200 hover:scale-[1.02] transform">
      <div className="p-4">
        {/* Header: Image + Heart + Basic Info */}
        <div className="relative mb-3">
          {/* Profile Image */}
          <div className="w-16 h-16 mx-auto relative mb-2">
            <Image
              src={flatmate.image_url}
              alt={flatmate.name}
              fill
              className={`object-cover rounded-full border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              sizes="64px"
            />
            
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-300 rounded-full" />
              </div>
            )}
          </div>

          {/* Heart icon */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsLiked(!isLiked)
            }}
            className="absolute top-0 right-0 p-1 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
          >
            <Heart 
              className={`h-3 w-3 ${
                isLiked ? 'text-red-500 fill-current' : 'text-gray-600'
              }`} 
            />
          </button>

          {/* Name and basic info */}
          <div className="text-center">
            <h3 className="font-bold text-base text-gray-900 leading-tight">
              {flatmate.name}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {flatmate.age}y • {flatmate.gender}
            </p>
          </div>
        </div>

        {/* Company + Budget Row */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 flex items-center">
            <Building2 className="h-2.5 w-2.5 mr-1" />
            {flatmate.company}
          </Badge>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900 leading-tight">
              ₹{(flatmate.budget_min/1000).toFixed(0)}k-{(flatmate.budget_max/1000).toFixed(0)}k
            </div>
            <div className="text-xs text-gray-500">Budget</div>
          </div>
        </div>

        {/* Lifestyle preferences - Compact row */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge 
            variant="outline" 
            className={`text-xs px-1.5 py-0.5 ${
              flatmate.non_smoker 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-orange-50 border-orange-200 text-orange-700'
            }`}
          >
            {flatmate.non_smoker ? '🚭' : '🚬'}
          </Badge>

          <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-gray-50 border-gray-200 text-gray-700 flex items-center">
            {getFoodIcon(flatmate.food_preference)}
            <span className="ml-0.5">{flatmate.food_preference === 'Non-Veg' ? 'Non-Veg' : flatmate.food_preference}</span>
          </Badge>

          {flatmate.gated_community && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-purple-50 border-purple-200 text-purple-700 flex items-center">
              <Shield className="h-2.5 w-2.5 mr-0.5" />
              Gated
            </Badge>
          )}
        </div>

        {/* Amenities - Compact icons only */}
        {flatmate.amenities.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-center gap-1">
              {flatmate.amenities.slice(0, 5).map((amenity, index) => (
                <div
                  key={index}
                  className="p-1.5 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                  title={amenity}
                >
                  {amenityIcons[amenity] || <Home className="h-3 w-3" />}
                </div>
              ))}
              {flatmate.amenities.length > 5 && (
                <div className="text-xs text-gray-500 ml-1">
                  +{flatmate.amenities.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preferred locations - Compact */}
        {flatmate.preferred_locations.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-center mb-1">
              <MapPin className="h-3 w-3 text-gray-400 mr-1" />
              <span className="text-xs text-gray-500">Prefers</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              {flatmate.preferred_locations.slice(0, 2).map((location, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className="text-xs px-1.5 py-0.5 bg-gray-50 border-gray-200 text-gray-600"
                >
                  {location.length > 12 ? location.substring(0, 12) + '...' : location}
                </Badge>
              ))}
              {flatmate.preferred_locations.length > 2 && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-1.5 py-0.5 bg-gray-50 border-gray-200 text-gray-600"
                >
                  +{flatmate.preferred_locations.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Connect button */}
        <Button 
          onClick={handleConnect}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 text-sm rounded-lg transition-colors"
        >
          Connect
        </Button>
      </div>
    </div>
  )
}