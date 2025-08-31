'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Bookmark, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useChat } from '@/contexts/chat-context'
import type { Flat } from '@/lib/supabase'

interface FlatCardProps {
  flat: Flat
  onClick?: () => void
}

export default function FlatCard({ flat, onClick }: FlatCardProps) {
  const [isSaved, setIsSaved] = useState(false)
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
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200"
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

        {/* Save icon */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (!user) {
              if (typeof window !== 'undefined') window.dispatchEvent(new Event('open-login-modal'))
              return
            }
            import('@/lib/saves').then(async ({ savesApi }) => {
              const { saved } = await savesApi.toggleSave('flat', flat.id)
              setIsSaved(saved)
            })
          }}
          className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-colors shadow-sm"
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'text-purple-500 fill-current' : 'text-gray-600'}`} />
        </button>

        {/* Room type badge */}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-white/90 text-gray-800 font-medium px-3 py-1 text-xs border-0">
            {flat.room_type}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title and location */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-purple-500 transition-colors">
            {flat.title}
          </h3>
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="line-clamp-1">{flat.location}</span>
          </div>
        </div>

        {/* Rent */}
        <div className="mb-4">
          <div className="text-2xl font-bold text-gray-900">
            ₹{flat.rent.toLocaleString('en-IN')}
            <span className="text-sm font-normal text-gray-500 ml-1">/month</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {flat.tags.slice(0, 3).map((tag, index) => (
            <Badge 
              key={index}
              variant="outline" 
              className="text-xs px-3 py-1 bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              {tag}
            </Badge>
          ))}
          {flat.tags.length > 3 && (
            <Badge 
              variant="outline" 
              className="text-xs px-3 py-1 bg-gray-50 border-gray-200 text-gray-600 rounded-full"
            >
              +{flat.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleMessageOwner}
            variant="outline"
            size="sm"
            className="flex-1 border-purple-200 text-purple-500 hover:bg-purple-50 hover:border-purple-500 transition-colors py-2.5 rounded-xl"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </Button>
          <Button
            onClick={handleGetDirections}
            variant="secondary"
            size="sm"
            className="flex-1 bg-gray-100 text-gray-800 hover:bg-gray-200 py-2.5 rounded-xl"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Directions
          </Button>
        </div>
      </div>
    </div>
  )
}

