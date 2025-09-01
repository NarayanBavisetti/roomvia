'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  alt?: string
}

export default function ImageGallery({ images, alt = 'Gallery image' }: ImageGalleryProps) {
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : []

  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [autoIndex, setAutoIndex] = useState(0)
  const sliderRef = useRef<HTMLDivElement | null>(null)

  // Simple autoplay for mobile slider
  useEffect(() => {
    if (safeImages.length <= 1) return
    const id = setInterval(() => {
      setAutoIndex(prev => (prev + 1) % safeImages.length)
    }, 4000)
    return () => clearInterval(id)
  }, [safeImages.length])

  // Scroll slider to active index on mobile
  useEffect(() => {
    const el = sliderRef.current
    if (!el) return
    const slideWidth = el.clientWidth
    el.scrollTo({ left: autoIndex * slideWidth, behavior: 'smooth' })
  }, [autoIndex])

  const openAt = (index: number) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  const showAllButton = safeImages.length > 5

  return (
    <div className="w-full">
      {/* Desktop: collage layout */}
      <div className="hidden lg:block">
        {safeImages.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <button
              onClick={() => openAt(0)}
              className="group relative col-span-2 aspect-video lg:aspect-[4/3] rounded-xl overflow-hidden bg-gray-200"
            >
              <Image src={safeImages[0]} alt={alt} fill className="object-cover transition-transform duration-300 group-hover:scale-105" priority />
            </button>
            <div className="grid grid-cols-2 gap-2">
              {safeImages.slice(1, 5).map((src, idx) => (
                <button
                  key={`thumb-${idx + 1}`}
                  onClick={() => openAt(idx + 1)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-200"
                >
                  <Image src={src} alt={`${alt} ${idx + 2}`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                </button>
              ))}
              {showAllButton && (
                <button
                  onClick={() => openAt(5)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-200"
                >
                  <Image src={safeImages[5] || safeImages[1]} alt={`${alt} more`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium">Show all photos</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
            <Home className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Mobile: swipeable slider */}
      <div className="lg:hidden">
        {safeImages.length > 0 ? (
          <div ref={sliderRef} className="relative w-full overflow-x-auto flex snap-x snap-mandatory gap-2 no-scrollbar">
            {safeImages.map((src, idx) => (
              <button
                key={`slide-${idx}`}
                onClick={() => openAt(idx)}
                className="group relative min-w-full aspect-video rounded-xl overflow-hidden bg-gray-200 snap-center"
              >
                <Image src={src} alt={`${alt} ${idx + 1}`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
              </button>
            ))}
          </div>
        ) : (
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
            <Home className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="bg-black/95 border-0 p-0 w-[95vw] h-[90vh] max-w-[95vw]">
          <div className="relative w-full h-full">
            {safeImages.length > 0 && (
              <Image src={safeImages[lightboxIndex] || safeImages[0]} alt={alt} fill className="object-contain" />
            )}
            {safeImages.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex(prev => (prev - 1 + safeImages.length) % safeImages.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-3 rounded-full hover:bg-white/30"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setLightboxIndex(prev => (prev + 1) % safeImages.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-3 rounded-full hover:bg-white/30"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 right-4 bg-white/10 text-white px-3 py-1 rounded-full text-sm">
                  {lightboxIndex + 1} / {safeImages.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


