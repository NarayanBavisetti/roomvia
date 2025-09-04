"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";

export interface SavedFilter {
  id: string;
  user_id: string;
  session_id: string | null;
  city: string | null;
  state: string | null;
  area: string | null;
  property_type: string | null;
  min_rent: number | null;
  max_rent: number | null;
  amenities: string[] | null;
  filters: Record<string, string[]>;
  usage_count: number;
  last_used: string;
  created_at: string;
  updated_at: string;
}

interface SaveFiltersPayload {
  user_id?: string;
  session_id?: string | null;
  filters: Record<string, string[]>;
  city?: string | null;
  state?: string | null;
  area?: string | null;
  property_type?: string | null;
  min_rent?: number | null;
  max_rent?: number | null;
  amenities?: string[];
}

interface UseSavedFiltersOptions {
  autoLoadOnMount?: boolean;
  debounceDelay?: number;
  searchLocation?: string;
  searchArea?: string;
}

interface UseSavedFiltersReturn {
  savedFilters: SavedFilter[];
  isLoading: boolean;
  error: string | null;
  saveFilters: (
    filters: Record<string, string[]>,
    options?: Partial<SaveFiltersPayload>
  ) => Promise<void>;
  loadSavedFilters: () => Promise<SavedFilter[]>;
  clearFilters: () => Promise<void>;
  debouncedSave: (
    filters: Record<string, string[]>,
    options?: Partial<SaveFiltersPayload>
  ) => void;
}

export const useSavedFilters = (
  options: UseSavedFiltersOptions = {}
): UseSavedFiltersReturn => {
  const {
    autoLoadOnMount = true,
    debounceDelay = 1000,
    searchLocation,
    searchArea,
  } = options;

  const { user } = useAuth();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved filters
  const loadSavedFilters = useCallback(async (): Promise<SavedFilter[]> => {
    if (!user?.id) {
      console.log(
        "No user logged in, skipping load saved filters. User object:",
        user
      );
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Loading saved filters for user:", user.id);
      console.log("Full user object:", user);

      const session = await (await import("@/lib/supabase")).supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const response = await fetch(`/api/filters?user_id=${user.id}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      console.log("Load response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Load response error text:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${errorText}` };
        }
        throw new Error(
          errorData.error || `Failed to load filters (${response.status})`
        );
      }

      const data = await response.json();
      console.log("Loaded saved filters:", data);

      const filters = data.filters || [];
      setSavedFilters(filters);
      return filters;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error loading saved filters";
      console.error("Error loading saved filters:", err);
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Save filters
  const saveFilters = useCallback(
    async (
      filters: Record<string, string[]>,
      saveOptions: Partial<SaveFiltersPayload> = {}
    ): Promise<void> => {
      if (!user?.id) {
        console.log("No user logged in, skipping save filters");
        return;
      }

      setError(null);

      const payload: SaveFiltersPayload = {
        user_id: user.id,
        session_id: null,
        filters,
        city: searchArea || null,
        state: searchLocation || null,
        area: searchArea || null,
        property_type: "flats",
        min_rent: null,
        max_rent: null,
        amenities: [],
        ...saveOptions,
      };

      console.log("Saving filters payload:", payload);

      try {
        const session = await (await import("@/lib/supabase")).supabase.auth.getSession();
        const token = session.data.session?.access_token;

        // Try PATCH first (for updating existing record)
        let response = await fetch("/api/filters", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });

        // If PATCH fails because no record exists, try POST to create
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: `HTTP ${response.status}: ${errorText}` };
          }

          // If update failed because no record exists, try creating with POST
          if (
            response.status === 500 &&
            errorData.error?.includes("Failed to update")
          ) {
            console.log(
              "No existing record found, trying POST to create new one"
            );
            response = await fetch("/api/filters", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(payload),
              credentials: "include",
            });
          }
        }

        console.log("Save response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Save response error text:", errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: `HTTP ${response.status}: ${errorText}` };
          }
          throw new Error(
            errorData.error || `Failed to save filters (${response.status})`
          );
        }

        const responseData = await response.json();
        console.log("Save response data:", responseData);
        console.log("Filters saved successfully");

        // Refresh the saved filters list
        await loadSavedFilters();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error saving filters";
        console.error("Error saving filters:", err);
        setError(errorMessage);
        throw err;
      }
    },
    [user?.id, searchLocation, searchArea, loadSavedFilters]
  );

  // Clear all filters
  const clearFilters = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      console.log("No user logged in, skipping clear filters");
      return;
    }

    setError(null);
    console.log("Clearing filters for user:", user.id);

    try {
      const session = await (await import("@/lib/supabase")).supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      console.log("Sending DELETE request to /api/filters");
      const response = await fetch(`/api/filters`, {
        method: "DELETE",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      console.log("DELETE response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DELETE response error text:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${errorText}` };
        }
        throw new Error(errorData.error || `Failed to clear filters (${response.status})`);
      }

      const responseData = await response.json();
      console.log("DELETE response data:", responseData);
      console.log("Filters cleared successfully");
      setSavedFilters([]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error clearing filters";
      console.error("Error clearing filters:", err);
      setError(errorMessage);
      throw err;
    }
  }, [user?.id]);

  // Debounced save
  const debouncedSave = useCallback(
    (
      filters: Record<string, string[]>,
      saveOptions: Partial<SaveFiltersPayload> = {}
    ) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveFilters(filters, saveOptions);
        } catch {
          // Error is already logged in saveFilters
        }
      }, debounceDelay);
    },
    [saveFilters, debounceDelay]
  );

  // Load filters on mount when user changes
  useEffect(() => {
    if (user && autoLoadOnMount) {
      loadSavedFilters();
    }
  }, [user, autoLoadOnMount, loadSavedFilters]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    savedFilters,
    isLoading,
    error,
    saveFilters,
    loadSavedFilters,
    clearFilters,
    debouncedSave,
  };
};
