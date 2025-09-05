import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'

interface BrokerInsightsData {
  insights: {
    totalSearches: number
    uniqueUsers: number
    propertyTypeDistribution: Array<{ property_type: string; search_count: number }>
    priceRanges: Record<string, number>
    popularAmenities: Array<{ amenity: string; usage_count: number }>
    locationPreferences: Array<{ area: string; search_count: number }>
  }
  ai_summary: string
  recommendations: string[]
  confidence: number
  fallback_used?: boolean
  metadata: {
    city: string
    days: number
    totalFilters: number
    analysisDate: string
    analysis_type?: string
    data_source?: string
    note?: string
  }
}

interface UseBrokerInsightsOptions {
  city: string
  days: number
  enabled?: boolean
}

export function useBrokerInsights({ city, days, enabled = true }: UseBrokerInsightsOptions) {
  const [error, setError] = useState<string | null>(null)

  const fetchBrokerInsights = useCallback(async (): Promise<BrokerInsightsData> => {
    setError(null)
    
    try {
      // Get session token for authentication
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch(
        `/api/broker-insights?city=${encodeURIComponent(city)}&days=${days}`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        }
      )
      
      const data = await response.json()

      if (!response.ok || !data.success) {
        const errorMessage = data.error || 'Failed to fetch broker insights'
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch broker insights'
      setError(errorMessage)
      throw err
    }
  }, [city, days])

  const queryResult = useQuery({
    queryKey: ['broker-insights', city, days],
    queryFn: fetchBrokerInsights,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Prevent refetch on tab focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    ...queryResult,
    error: queryResult.error || error,
    refetch: queryResult.refetch,
  }
}

// Hook for manual refresh with loading state
export function useBrokerInsightsRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refresh = useCallback(async (queryClient: any, city: string, days: number) => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries(['broker-insights', city, days])
      await queryClient.refetchQueries(['broker-insights', city, days])
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  return {
    refresh,
    isRefreshing,
  }
}