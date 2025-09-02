"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase, type Flat } from "@/lib/supabase";

interface UseFlatsDataOptions {
  pageSize?: number;
  searchLocation?: string;
  searchArea?: string;
  filters?: Record<string, string[]>;
}

interface UseFlatsDataReturn {
  flats: Flat[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  totalCount: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

// Global cache for flats data to avoid unnecessary API calls
const flatsCache = new Map<
  string,
  {
    data: Flat[];
    timestamp: number;
    totalCount: number;
  }
>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Generate cache key based on search and filter parameters
function getCacheKey(options: UseFlatsDataOptions): string {
  const { searchLocation, searchArea, filters } = options;
  return JSON.stringify({
    searchLocation: searchLocation || "",
    searchArea: searchArea || "",
    filters: filters || {},
  });
}

// No mock data - only real database data will be used

export function useFlatsData(
  options: UseFlatsDataOptions = {}
): UseFlatsDataReturn {
  const {
    pageSize = 20,
    searchLocation = "",
    searchArea = "",
    filters = {},
  } = options;

  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>("");

  // Apply filters to flats data
  const applyFilters = useCallback(
    (data: Flat[]): Flat[] => {
      let filtered = data;

      // Search filtering
      if (searchLocation) {
        filtered = filtered.filter((flat: Flat) =>
          flat.location.toLowerCase().includes(searchLocation.toLowerCase())
        );
      }

      if (searchArea) {
        filtered = filtered.filter(
          (flat: Flat) =>
            flat.location.toLowerCase().includes(searchArea.toLowerCase()) ||
            flat.title.toLowerCase().includes(searchArea.toLowerCase())
        );
      }

      // Apply filters
      if (filters.price?.length) {
        filtered = filtered.filter((flat: Flat) => {
          return filters.price.some((priceRange: string) => {
            switch (priceRange) {
              case "< ₹15k":
                return flat.rent < 15000;
              case "₹15k-25k":
                return flat.rent >= 15000 && flat.rent <= 25000;
              case "₹25k-40k":
                return flat.rent >= 25000 && flat.rent <= 40000;
              case "> ₹40k":
                return flat.rent > 40000;
              default:
                return true;
            }
          });
        });
      }

      if (filters.room_type?.length) {
        filtered = filtered.filter((flat: Flat) =>
          filters.room_type.includes(flat.room_type)
        );
      }

      if (filters.furnishing?.length) {
        filtered = filtered.filter((flat: Flat) =>
          filters.furnishing.some((furnishing: string) =>
            flat.tags.some((tag: string) =>
              tag.toLowerCase().includes(furnishing.toLowerCase())
            )
          )
        );
      }

      if (filters.pets?.length && filters.pets.includes("true")) {
        filtered = filtered.filter((flat: Flat) =>
          flat.tags.some((tag: string) => tag.toLowerCase().includes("pet"))
        );
      }

      return filtered;
    },
    [searchLocation, searchArea, filters]
  );

  // Fetch data from API or cache
  const fetchFlats = useCallback(
    async (page: number = 0, reset: boolean = false): Promise<void> => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const requestId = `${Date.now()}_${page}`;
      lastRequestRef.current = requestId;

      try {
        if (reset || page === 0) {
          setLoading(true);
        }
        setError(null);

        // Check cache first
        const cacheKey = getCacheKey({ searchLocation, searchArea, filters });
        const cached = flatsCache.get(cacheKey);
        const now = Date.now();

        if (cached && now - cached.timestamp < CACHE_EXPIRATION && page === 0) {
          // Use cached data for first page
          const filteredData = applyFilters(cached.data);
          const paginatedData = filteredData.slice(0, pageSize);

          setFlats(paginatedData);
          setTotalCount(filteredData.length);
          setHasMore(filteredData.length > pageSize);
          setCurrentPage(0);
          setLoading(false);
          return;
        }

        // Check if this request is still the latest
        if (signal.aborted || lastRequestRef.current !== requestId) {
          return;
        }

        let allData: Flat[] = [];
        let count = 0;

        // Fetch from Supabase database
        const {
          data: supabaseData,
          error: supabaseError,
          count: supabaseCount,
        } = await supabase
          .from("listings")
          .select(
            `
          id,
          user_id,
          title,
          property_type,
          city,
          state,
          country,
          rent,
          images,
          highlights,
          created_at
        `,
            { count: "exact" }
          )
          .order("created_at", { ascending: false })
          .abortSignal(signal);

        if (signal.aborted || lastRequestRef.current !== requestId) {
          return;
        }

        if (supabaseError) {
          throw new Error(`Database error: ${supabaseError.message}`);
        }

        // Transform data to match Flat interface
        allData = (supabaseData || []).map((listing) => ({
          id: listing.id,
          owner_id: listing.user_id,
          title: listing.title,
          location: `${listing.city}, ${listing.state}`,
          rent: listing.rent,
          images: Array.isArray(listing.images) ? listing.images : [],
          image_url:
            listing.images && listing.images.length > 0
              ? listing.images.find(
                  (img: { is_primary?: boolean; url: string }) => img.is_primary
                )?.url ||
                listing.images[0]?.url ||
                ""
              : "",
          room_type: listing.property_type,
          tags: listing.highlights || [],
          created_at: listing.created_at,
        }));

        count = supabaseCount || allData.length;

        // Cache the raw data
        flatsCache.set(cacheKey, {
          data: allData,
          timestamp: now,
          totalCount: count,
        });

        // Apply filters
        const filteredData = applyFilters(allData);

        // Calculate pagination
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(0, endIndex);

        // Check if this request is still the latest
        if (signal.aborted || lastRequestRef.current !== requestId) {
          return;
        }

        if (reset || page === 0) {
          setFlats(paginatedData);
        } else {
          setFlats((prev) => [
            ...prev,
            ...filteredData.slice(startIndex, endIndex),
          ]);
        }

        setTotalCount(filteredData.length);
        setHasMore(endIndex < filteredData.length);
        setCurrentPage(page);
      } catch (err) {
        if (signal.aborted || lastRequestRef.current !== requestId) {
          return;
        }

        console.error("Error fetching flats:", err);
        setError(
          "Failed to load properties. Please check your connection and try again."
        );

        // No fallback data - show empty state
        if (reset || page === 0) {
          setFlats([]);
        }

        setTotalCount(0);
        setHasMore(false);
        setCurrentPage(0);
      } finally {
        if (lastRequestRef.current === requestId) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [pageSize, searchLocation, searchArea, filters, applyFilters]
  );

  // Load more data (pagination)
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || loading) return;
    await fetchFlats(currentPage + 1, false);
  }, [hasMore, loading, currentPage, fetchFlats]);

  // Refresh data
  const refresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);

    // Clear cache for current parameters
    const cacheKey = getCacheKey({ searchLocation, searchArea, filters });
    flatsCache.delete(cacheKey);

    await fetchFlats(0, true);
  }, [fetchFlats, searchLocation, searchArea, filters]);

  // Initial load and when dependencies change
  useEffect(() => {
    fetchFlats(0, true);

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchFlats]);

  // Memoized return value
  const returnValue = useMemo(
    () => ({
      flats,
      loading,
      hasMore,
      error,
      totalCount,
      loadMore,
      refresh,
      isRefreshing,
    }),
    [
      flats,
      loading,
      hasMore,
      error,
      totalCount,
      loadMore,
      refresh,
      isRefreshing,
    ]
  );

  return returnValue;
}
