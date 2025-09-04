import { useQuery } from "@tanstack/react-query";

interface Metrics {
  totalSearches: number;
  uniqueUsers: number;
}

export function useBrokerMetrics(city: string, days: number, enabled = true) {
  return useQuery<Metrics>({
    queryKey: ["broker-insights-metrics", city, days],
    enabled,
    queryFn: async () => {
      const res = await fetch(
        `/api/broker-insights/metrics?city=${encodeURIComponent(
          city
        )}&days=${days}`
      );
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to load metrics");
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

type PropertyTypeDistribution = Array<{
  property_type: string;
  search_count: number;
}>;

export function usePropertyTypeDistribution(
  city: string,
  days: number,
  enabled = true
) {
  return useQuery<PropertyTypeDistribution>({
    queryKey: ["broker-insights-property-types", city, days],
    enabled,
    queryFn: async () => {
      const res = await fetch(
        `/api/broker-insights/property-types?city=${encodeURIComponent(
          city
        )}&days=${days}`
      );
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to load property types");
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePriceRanges(city: string, days: number, enabled = true) {
  return useQuery<Record<string, number>>({
    queryKey: ["broker-insights-price-ranges", city, days],
    enabled,
    queryFn: async () => {
      const res = await fetch(
        `/api/broker-insights/price-ranges?city=${encodeURIComponent(
          city
        )}&days=${days}`
      );
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to load price ranges");
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

type Amenity = { amenity: string; usage_count: number };

export function usePopularAmenities(
  city: string,
  days: number,
  enabled = true
) {
  return useQuery<Amenity[]>({
    queryKey: ["broker-insights-amenities", city, days],
    enabled,
    queryFn: async () => {
      const res = await fetch(
        `/api/broker-insights/amenities?city=${encodeURIComponent(
          city
        )}&days=${days}`
      );
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to load amenities");
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

type LocationPref = { area: string; search_count: number };

export function useLocationPreferences(
  city: string,
  days: number,
  enabled = true
) {
  return useQuery<LocationPref[]>({
    queryKey: ["broker-insights-locations", city, days],
    enabled,
    queryFn: async () => {
      const res = await fetch(
        `/api/broker-insights/locations?city=${encodeURIComponent(
          city
        )}&days=${days}`
      );
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to load locations");
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
