'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Heart, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useChat } from '@/contexts/chat-context'
import type { Flat } from '@/lib/supabase'

interface FlatCardProps {
  flat: Flat
  onClick?: () => void
}

export default function FlatCard({ flat, onClick }: FlatCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const { user } = useAuth()
  const { openChat } = useChat()

  // Mock owner data - in real app this would come from the flat object
  const ownerEmail = `owner_${flat.id}@example.com`

  const handleMessageOwner = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      // Open login modal globally if not authenticated
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open-login-modal'))
      }
      return
    }
    
    // Generate a mock owner ID based on flat ID
    const ownerId = `owner_${flat.id}`
    openChat(ownerId, ownerEmail)
  }

  const handleGetDirections = (e: React.MouseEvent) => {
    e.stopPropagation()
    const destination = encodeURIComponent(flat.location)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    window.open(url, '_blank')
  }

  return (
    <div 
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200"
      onClick={onClick}
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={flat.image_url}
          alt={flat.title}
          fill
          className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-300 rounded-lg" />
          </div>
        )}

        {/* Heart icon */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsLiked(!isLiked)
          }}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Heart 
            className={`h-4 w-4 ${
              isLiked ? 'text-red-500 fill-current' : 'text-gray-600'
            }`} 
          />
        </button>

        {/* Room type badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-gray-800 font-medium">
            {flat.room_type}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and location */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {flat.title}
          </h3>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{flat.location}</span>
          </div>
        </div>

        {/* Rent */}
        <div className="mb-3">
          <div className="text-2xl font-bold text-gray-900">
            ₹{flat.rent.toLocaleString('en-IN')}
            <span className="text-sm font-normal text-gray-600 ml-1">/month</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {flat.tags.slice(0, 3).map((tag, index) => (
            <Badge 
              key={index}
              variant="outline" 
              className="text-xs px-2 py-0.5 bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            >
              {tag}
            </Badge>
          ))}
          {flat.tags.length > 3 && (
            <Badge 
              variant="outline" 
              className="text-xs px-2 py-0.5 bg-gray-50 border-gray-200 text-gray-600"
            >
              +{flat.tags.length - 3} more
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleMessageOwner}
            variant="outline"
            size="sm"
            className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </Button>
          <Button
            onClick={handleGetDirections}
            variant="secondary"
            size="sm"
            className="flex-1 bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Get directions
          </Button>
        </div>
      </div>
    </div>
  )
}

