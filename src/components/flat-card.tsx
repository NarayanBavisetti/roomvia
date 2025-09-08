'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Heart, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useChat } from '@/contexts/chat-context'
import type { Flat } from '@/lib/supabase'

interface FlatCardProps {
  flat: Flat
  onClick?: () => void
}

export default function FlatCard({ flat, onClick }: FlatCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { user } = useAuth()

  // Check if flat is already saved when component loads
  useEffect(() => {
    const checkSaveStatus = async () => {
      if (!user) {
        setIsSaved(false)
        return
      }
      try {
        const { savesApi } = await import('@/lib/saves')
        const saved = await savesApi.isSaved('flat', flat.id)
        setIsSaved(saved)
      } catch (error) {
        console.error('Error checking save status:', error)
        setIsSaved(false)
      }
    }
    checkSaveStatus()
  }, [user, flat.id])

  // Auto-advance slideshow if multiple images
  useEffect(() => {
    if (!flat.images || flat.images.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % flat.images!.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [flat.images])

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!flat.images || flat.images.length <= 1) return
    setCurrentIndex(prev => (prev - 1 + flat.images!.length) % flat.images!.length)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!flat.images || flat.images.length <= 1) return
    setCurrentIndex(prev => (prev + 1) % flat.images!.length)
  }
  const { openChat } = useChat()

  const handleMessageOwner = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      // Open login modal globally if not authenticated
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open-login-modal'))
      }
      return
    }
    
    // Use real owner user id if available; otherwise, block and prompt
    if (!flat.owner_id) {
      console.warn('Listing missing owner_id; cannot start chat')
      return
    }
    openChat(flat.owner_id, `user_${flat.owner_id}`, flat.id)
  }

  const handleGetDirections = (e: React.MouseEvent) => {
    e.stopPropagation()
    const destination = encodeURIComponent(flat.location)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    window.open(url, '_blank')
  }

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('open-login-modal'))
      return
    }
    if (saving) return
    setSaving(true)
    const previous = isSaved
    try {
      // Optimistic UI
      setIsSaved(!previous)
      const { savesApi } = await import('@/lib/saves')
      const { saved, error } = await savesApi.toggleSave('flat', flat.id)
      if (error) {
        console.error('Save toggle failed:', error)
        setIsSaved(previous)
      } else {
        setIsSaved(saved)
      }
    } catch (e) {
      console.error('Save toggle failed:', e)
      setIsSaved(previous)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div 
      className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-purple-200 hover:-translate-y-0.5"
      onClick={onClick}
    >
      {/* Image container with slideshow */}
      <div className="relative aspect-[5/3] overflow-hidden bg-gray-50">
        {(() => {
          const imageSrc = flat.images && flat.images.length > 0
            ? (flat.images[currentIndex]?.url || flat.image_url)
            : flat.image_url;
          
          return imageSrc ? (
            <Image
              src={imageSrc}
              alt={flat.title}
              fill
              className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <div className="text-gray-400 text-center">
                <div className="w-12 h-12 mx-auto mb-2 opacity-50">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
                <p className="text-sm">No image</p>
              </div>
            </div>
          );
        })()}

        {/* Manual navigation arrows */}
        {flat.images && flat.images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-[9] bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-all duration-200"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-[9] bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-all duration-200"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
        
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-300 rounded-lg" />
          </div>
        )}

<button
  onClick={handleToggleSave}
  aria-pressed={isSaved}
  className="absolute top-2 right-2 p-1 hover:scale-110 transition-all duration-200"
>
  <Heart className={`h-5 w-5 transition-all duration-200 stroke-white stroke-2 ${isSaved ? 'text-red-500 fill-current drop-shadow-lg' : 'text-gray-400 fill-current'}`} />
</button>

        {/* Dots indicator */}
        {flat.images && flat.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {flat.images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx) }}
                className={`h-1.5 w-1.5 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/60'}`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Room type badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-purple-500 text-white font-medium px-2.5 py-0.5 text-xs border-0 rounded-full shadow-sm">
            {flat.room_type}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title and location */}
        <div className="mb-2.5">
          <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-1 line-clamp-1 group-hover:text-purple-600 transition-colors leading-tight">
            {flat.title}
          </h3>
          <div className="flex items-center text-gray-500 text-xs">
            <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span className="line-clamp-1">{flat.location}</span>
          </div>
        </div>

        {/* Rent */}
        <div className="mb-2.5">
          <div className="text-lg md:text-xl font-bold text-gray-900">
            ₹{flat.rent.toLocaleString('en-IN')}
            <span className="text-xs font-normal text-gray-500 ml-1">/month</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {flat.tags.slice(0, 3).map((tag, index) => (
            <Badge 
              key={index}
              variant="outline" 
              className="text-[10px] px-2 py-0.5 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 rounded-full font-medium"
            >
              {tag}
            </Badge>
          ))}
          {flat.tags.length > 3 && (
            <Badge 
              variant="outline" 
              className="text-[10px] px-2 py-0.5 bg-gray-50 border-gray-200 text-gray-600 rounded-full font-medium"
            >
              +{flat.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleMessageOwner}
            variant="outline"
            size="sm"
            className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-500 transition-all duration-200 py-1.5 rounded-lg text-xs font-medium hover:scale-105"
          >
            <MessageCircle className="h-3 w-3 mr-1.5" />
            Chat
          </Button>
          <Button
            onClick={handleGetDirections}
            variant="secondary"
            size="sm"
            className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 py-1.5 rounded-lg text-xs font-medium hover:scale-105"
          >
            <MapPin className="h-3 w-3 mr-1.5" />
            Directions
          </Button>
        </div>
      </div>
    </div>
  )
}

