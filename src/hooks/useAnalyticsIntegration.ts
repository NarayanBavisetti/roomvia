'use client'

import { useEffect } from 'react'
import { useAnalytics } from '@/lib/analytics'
import { useAuth } from '@/contexts/auth-context'

// Hook to integrate analytics tracking with existing components
export function useAnalyticsIntegration() {
  const { trackPageView, trackEvent } = useAnalytics()
  const { user } = useAuth()

  // Track page views automatically
  useEffect(() => {
    const cleanup = trackPageView('page', window.location.pathname)
    return cleanup
  }, [trackPageView])

  // Update analytics service when user changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { analyticsService } = require('@/lib/analytics')
      analyticsService.updateUserSession(user?.id)
    }
  }, [user])

  return {
    trackEvent,
    trackPageView
  }
}

// Hook specifically for listing components
export function useListingAnalytics() {
  const { trackListingView, trackEvent } = useAnalytics()

  const onListingView = (listingId: string, brokerId: string) => {
    trackListingView(listingId, brokerId)
  }

  const onListingSave = (listingId: string) => {
    trackEvent('save', listingId)
  }

  const onListingInquiry = (listingId: string, inquiryType: 'message' | 'phone' | 'email' = 'message') => {
    trackEvent('inquiry', listingId, { inquiryType })
  }

  const onPhoneReveal = (listingId: string) => {
    trackEvent('phone_reveal', listingId)
  }

  const onListingShare = (listingId: string, platform?: string) => {
    trackEvent('share', listingId, { platform })
  }

  const onFeatureClick = (listingId: string, feature: string) => {
    trackEvent('click', listingId, { feature, element: 'feature_list' })
  }

  const onPhotoClick = (listingId: string, photoIndex: number) => {
    trackEvent('click', listingId, { element: 'photo', photoIndex })
  }

  return {
    onListingView,
    onListingSave,
    onListingInquiry,
    onPhoneReveal,
    onListingShare,
    onFeatureClick,
    onPhotoClick
  }
}

// Hook for search analytics
export function useSearchAnalytics() {
  const { trackSearch } = useAnalytics()

  const onSearch = (query?: string, filters?: any, resultsCount?: number) => {
    trackSearch(query, filters, resultsCount)
  }

  const onFilterChange = (filters: any, resultsCount: number) => {
    trackSearch(undefined, filters, resultsCount)
  }

  return {
    onSearch,
    onFilterChange
  }
}