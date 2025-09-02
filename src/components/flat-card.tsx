'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Bookmark, MessageCircle } from 'lucide-react'
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
  const { user } = useAuth()
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
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200"
      onClick={onClick}
    >
      {/* Image container with slideshow */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
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
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              aria-label="Previous image"
            >
              {/* Using a simple chevron */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
        
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-300 rounded-lg" />
          </div>
        )}

        {/* Save icon */}
        <button
          onClick={handleToggleSave}
          aria-pressed={isSaved}
          className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-colors shadow-sm"
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'text-purple-500 fill-current' : 'text-gray-600'}`} />
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
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-white/90 text-gray-800 font-medium px-3 py-1 text-xs border-0">
            {flat.room_type}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and location */}
        <div className="mb-3">
          <h3 className="font-semibold text-base md:text-lg text-gray-900 mb-1.5 line-clamp-1 group-hover:text-purple-500 transition-colors">
            {flat.title}
          </h3>
          <div className="flex items-center text-gray-500 text-xs md:text-sm">
            <MapPin className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
            <span className="line-clamp-1">{flat.location}</span>
          </div>
        </div>

        {/* Rent */}
        <div className="mb-3">
          <div className="text-xl md:text-2xl font-bold text-gray-900">
            ₹{flat.rent.toLocaleString('en-IN')}
            <span className="text-xs md:text-sm font-normal text-gray-500 ml-1">/month</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {flat.tags.slice(0, 3).map((tag, index) => (
            <Badge 
              key={index}
              variant="outline" 
              className="text-[11px] px-2.5 py-0.5 bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              {tag}
            </Badge>
          ))}
          {flat.tags.length > 3 && (
            <Badge 
              variant="outline" 
              className="text-[11px] px-2.5 py-0.5 bg-gray-50 border-gray-200 text-gray-600 rounded-full"
            >
              +{flat.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <Button
            onClick={handleMessageOwner}
            variant="outline"
            size="sm"
            className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-500 transition-colors py-2 rounded-lg"
          >
            <MessageCircle className="h-3.5 w-3.5 mr-2" />
            Chat
          </Button>
          <Button
            onClick={handleGetDirections}
            variant="secondary"
            size="sm"
            className="flex-1 bg-gray-100 text-gray-800 hover:bg-gray-200 py-2 rounded-lg"
          >
            <MapPin className="h-3.5 w-3.5 mr-2" />
            Directions
          </Button>
        </div>
      </div>
    </div>
  )
}

