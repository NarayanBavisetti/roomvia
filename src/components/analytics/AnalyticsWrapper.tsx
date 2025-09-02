'use client'

import React, { useEffect } from 'react'
import { useAnalyticsIntegration } from '@/hooks/useAnalyticsIntegration'

interface AnalyticsWrapperProps {
  children: React.ReactNode
}

// Global analytics wrapper component
export function AnalyticsWrapper({ children }: AnalyticsWrapperProps) {
  useAnalyticsIntegration()
  
  return <>{children}</>
}

// Wrapper for listing cards to track interactions
interface ListingAnalyticsWrapperProps {
  listingId: string
  brokerId: string
  children: React.ReactNode
  className?: string
}

export function ListingAnalyticsWrapper({ 
  listingId, 
  brokerId, 
  children, 
  className 
}: ListingAnalyticsWrapperProps) {
  const { trackListingView } = useAnalyticsIntegration()

  useEffect(() => {
    // Track listing view when component mounts
    trackListingView(listingId, { property_type: '', city: '', state: '', rent: 0 })
  }, [listingId, brokerId, trackListingView])

  return (
    <div className={className}>
      {children}
    </div>
  )
}

// Enhanced listing card with analytics tracking
interface AnalyticsListingCardProps {
  listing: {
    id: string
    user_id: string
    title: string
    location: string
    rent: number
    property_type: string
    highlights: string[]
    image_urls: string[]
    status: string
  }
  children: React.ReactNode
  onSave?: () => void
  onInquiry?: () => void
  onPhoneReveal?: () => void
  onShare?: (platform?: string) => void
}

// Props that can be injected into listing card children
interface ChildAnalyticsHandlers {
  onSave?: () => void
  onInquiry?: () => void
  onPhoneReveal?: () => void
  onShare?: (platform?: string) => void
  onFeatureClick?: (feature: string) => void
  onPhotoClick?: (photoIndex: number) => void
}

export function AnalyticsListingCard({ 
  listing, 
  children, 
  onSave,
  onInquiry,
  onPhoneReveal,
  onShare
}: AnalyticsListingCardProps) {
  const { 
    trackSave, 
    trackMessage, 
    trackPhoneReveal
  } = useAnalyticsIntegration()

  const handleSave = () => {
    trackSave(listing.id, 'listing')
    onSave?.()
  }

  const handleInquiry = () => {
    trackMessage(listing.user_id, listing.id)
    onInquiry?.()
  }

  const handlePhoneReveal = () => {
    trackPhoneReveal(listing.id)
    onPhoneReveal?.()
  }

  const handleShare = (platform?: string) => {
    // No tracking for share yet
    onShare?.(platform)
  }

  const handleFeatureClick = (feature: string) => {
    // No tracking for feature click yet
    console.log('Feature clicked:', feature)
  }

  const handlePhotoClick = (photoIndex: number) => {
    // No tracking for photo click yet
    console.log('Photo clicked:', photoIndex)
  }

  // Clone children and pass analytics handlers
  const enhancedChildren = React.cloneElement<ChildAnalyticsHandlers>(
    children as React.ReactElement<ChildAnalyticsHandlers>,
    {
      onSave: handleSave,
      onInquiry: handleInquiry,
      onPhoneReveal: handlePhoneReveal,
      onShare: handleShare,
      onFeatureClick: handleFeatureClick,
      onPhotoClick: handlePhotoClick
    }
  )

  return (
    <ListingAnalyticsWrapper 
      listingId={listing.id} 
      brokerId={listing.user_id}
    >
      {enhancedChildren}
    </ListingAnalyticsWrapper>
  )
}

// Search analytics wrapper
interface SearchAnalyticsWrapperProps {
  children: React.ReactNode
}

export function SearchAnalyticsWrapper({ children }: SearchAnalyticsWrapperProps) {
  const { trackSearch, trackFilterApply } = useAnalyticsIntegration()

  // Enhanced children with search tracking
  const enhancedChildren = React.cloneElement<{ onSearch?: typeof trackSearch; onFilterChange?: typeof trackFilterApply }>(
    children as React.ReactElement<{ onSearch?: typeof trackSearch; onFilterChange?: typeof trackFilterApply }>,
    {
      onSearch: trackSearch,
      onFilterChange: trackFilterApply
    }
  )

  return <>{enhancedChildren}</>
}