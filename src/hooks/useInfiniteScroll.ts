'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  loading: boolean
  hasMore: boolean
  onLoadMore: () => Promise<void>
  threshold?: number
  rootMargin?: string
}

export function useInfiniteScroll({
  loading,
  hasMore,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '100px'
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)

  const handleObserver = useCallback(async (entries: IntersectionObserverEntry[]) => {
    const target = entries[0]
    if (target.isIntersecting && !loading && hasMore) {
      try {
        await onLoadMore()
      } catch (error) {
        console.error('Error loading more items:', error)
      }
    }
  }, [loading, hasMore, onLoadMore])

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold,
      rootMargin
    })

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleObserver, threshold, rootMargin])

  const setElement = useCallback((element: HTMLDivElement | null) => {
    elementRef.current = element
    if (element && observerRef.current) {
      observerRef.current.observe(element)
    }
  }, [])

  return { setElement }
}