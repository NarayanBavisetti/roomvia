"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase, type Flat } from "@/lib/supabase";
import { normalizeFiltersForData, normalizeText } from "@/lib/filterUtils";

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

  // Normalize incoming filters so the data layer sees a consistent shape
  const normalizedFilters = useMemo(
    () => normalizeFiltersForData(filters || {}),
    [filters]
  );

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

      // Apply budget range if provided from FilterBar (budget_min/budget_max)
      const minStr = normalizedFilters.budget_min?.[0];
      const maxStr = normalizedFilters.budget_max?.[0];
      const minBudget = minStr ? Number(minStr) : undefined;
      const maxBudget = maxStr ? Number(maxStr) : undefined;
      if (minBudget !== undefined || maxBudget !== undefined) {
        filtered = filtered.filter((flat: Flat) => {
          const meetsMin = minBudget === undefined || flat.rent >= minBudget;
          const meetsMax = maxBudget === undefined || flat.rent <= maxBudget;
          return meetsMin && meetsMax;
        });
      }

      // BHK filter: normalized compare so "2BHK" equals "2 BHK"
      if (normalizedFilters.bhk?.length) {
        const allowed = new Set(
          normalizedFilters.bhk.map((label: string) => normalizeText(label))
        );
        filtered = filtered.filter((flat: Flat) =>
          allowed.has(normalizeText(flat.room_type))
        );
      }

      // Amenities and other tag-like filters from 'amenities'
      if (normalizedFilters.amenities?.length) {
        filtered = filtered.filter((flat: Flat) =>
          normalizedFilters.amenities!.some((amenity: string) =>
            flat.tags.some((tag: string) =>
              tag.toLowerCase().includes(amenity.toLowerCase())
            )
          )
        );
      }

      // Locality mapping to area or city/state string contains
      if (normalizedFilters.locality?.length) {
        const searchTerms = normalizedFilters.locality.map((s: string) =>
          normalizeText(s)
        );
        filtered = filtered.filter((flat: Flat) =>
          searchTerms.some(
            (term: string) =>
              normalizeText(flat.area).includes(term) ||
              normalizeText(flat.city).includes(term) ||
              normalizeText(flat.state).includes(term)
          )
        );
      }

      // Broker filter mapping ('No Broker' vs 'Broker')
      if (normalizedFilters.broker?.length) {
        const wantsNoBroker = normalizedFilters.broker.includes("No Broker");
        const wantsBroker = normalizedFilters.broker.includes("Broker");
        if (wantsNoBroker && !wantsBroker) {
          filtered = filtered.filter(
            (flat: Flat) =>
              !flat.tags.some((tag: string) =>
                tag.toLowerCase().includes("broker")
              )
          );
        } else if (wantsBroker && !wantsNoBroker) {
          filtered = filtered.filter((flat: Flat) =>
            flat.tags.some((tag: string) =>
              tag.toLowerCase().includes("broker")
            )
          );
        }
      }

      // Gender filter mapping if present
      if (normalizedFilters.gender?.length) {
        const desired = new Set(
          normalizedFilters.gender.map((g: string) => g.toLowerCase())
        );
        filtered = filtered.filter((flat: Flat) =>
          flat.tags.some((tag: string) => desired.has(tag.toLowerCase()))
        );
      }

      return filtered;
    },
    [searchLocation, searchArea, normalizedFilters]
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
        const cacheKey = getCacheKey({
          searchLocation,
          searchArea,
          filters: normalizedFilters,
        });
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
          area,
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
          location: listing.area
            ? `${listing.area}, ${listing.city}, ${listing.state}`
            : `${listing.city}, ${listing.state}`,
          area: listing.area,
          city: listing.city,
          state: listing.state,
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
    [pageSize, searchLocation, searchArea, normalizedFilters, applyFilters]
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
    const cacheKey = getCacheKey({
      searchLocation,
      searchArea,
      filters: normalizedFilters,
    });
    flatsCache.delete(cacheKey);

    await fetchFlats(0, true);
  }, [fetchFlats, searchLocation, searchArea, normalizedFilters]);

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
