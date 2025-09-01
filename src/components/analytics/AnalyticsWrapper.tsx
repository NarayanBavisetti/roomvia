'use client'

import React, { useEffect } from 'react'
import { useListingAnalytics, useSearchAnalytics, useAnalyticsIntegration } from '@/hooks/useAnalyticsIntegration'

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
  const { onListingView } = useListingAnalytics()

  useEffect(() => {
    // Track listing view when component mounts
    onListingView(listingId, brokerId)
  }, [listingId, brokerId, onListingView])

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

export function AnalyticsListingCard({ 
  listing, 
  children, 
  onSave,
  onInquiry,
  onPhoneReveal,
  onShare
}: AnalyticsListingCardProps) {
  const { 
    onListingSave, 
    onListingInquiry, 
    onPhoneReveal: trackPhoneReveal,
    onListingShare,
    onFeatureClick,
    onPhotoClick
  } = useListingAnalytics()

  const handleSave = () => {
    onListingSave(listing.id)
    onSave?.()
  }

  const handleInquiry = () => {
    onListingInquiry(listing.id)
    onInquiry?.()
  }

  const handlePhoneReveal = () => {
    trackPhoneReveal(listing.id)
    onPhoneReveal?.()
  }

  const handleShare = (platform?: string) => {
    onListingShare(listing.id, platform)
    onShare?.(platform)
  }

  const handleFeatureClick = (feature: string) => {
    onFeatureClick(listing.id, feature)
  }

  const handlePhotoClick = (photoIndex: number) => {
    onPhotoClick(listing.id, photoIndex)
  }

  // Clone children and pass analytics handlers
  const enhancedChildren = React.cloneElement(children as React.ReactElement, {
    onSave: handleSave,
    onInquiry: handleInquiry,
    onPhoneReveal: handlePhoneReveal,
    onShare: handleShare,
    onFeatureClick: handleFeatureClick,
    onPhotoClick: handlePhotoClick
  })

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
  const { onSearch, onFilterChange } = useSearchAnalytics()

  // Enhanced children with search tracking
  const enhancedChildren = React.cloneElement(children as React.ReactElement, {
    onSearch,
    onFilterChange
  })

  return <>{enhancedChildren}</>
}