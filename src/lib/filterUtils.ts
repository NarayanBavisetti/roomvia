/**
 * Filter utility functions for accommodation rental app
 */

export interface FilterState {
  // Search
  state: string;
  area: string;
  searchQuery: string;

  // Core Filters
  localities: string[];
  budget: [number, number];
  gender: string;
  brokerType: string;

  // Extended Filters
  foodPreference: string;
  lifestyle: string;
  propertyTypes: string[];
  amenities: string[];
}

export interface Listing {
  id: string;
  title: string;
  location: string;
  locality: string;
  rent: number;
  gender: "male" | "female" | "unisex";
  brokerType: "owner" | "broker";
  foodPreference?: "vegetarian" | "non_vegetarian" | "both";
  lifestyle?: "smoker" | "non_smoker" | "no_preference";
  propertyType: "gated_community" | "independent_house" | "apartment";
  amenities: string[];
  [key: string]: string | string[] | number | number[] | boolean | undefined;
}

/**
 * Default filter state
 */
export const getDefaultFilters = (): FilterState => ({
  state: "Telangana",
  area: "Hyderabad",
  searchQuery: "",
  localities: [],
  budget: [6899, 28699],
  gender: "",
  brokerType: "",
  foodPreference: "",
  lifestyle: "",
  propertyTypes: [],
  amenities: [],
});

/**
 * Encode filters to URL parameters
 */
export const filtersToUrlParams = (filters: FilterState): URLSearchParams => {
  const params = new URLSearchParams();

  // Only add non-default values to keep URL clean
  const defaultFilters = getDefaultFilters();

  if (filters.state !== defaultFilters.state) {
    params.set("state", filters.state);
  }

  if (filters.area !== defaultFilters.area) {
    params.set("area", filters.area);
  }

  if (filters.searchQuery) {
    params.set("q", filters.searchQuery);
  }

  if (filters.localities.length > 0) {
    params.set("localities", filters.localities.join(","));
  }

  if (
    filters.budget[0] !== defaultFilters.budget[0] ||
    filters.budget[1] !== defaultFilters.budget[1]
  ) {
    params.set("budget", `${filters.budget[0]}-${filters.budget[1]}`);
  }

  if (filters.gender) {
    params.set("gender", filters.gender);
  }

  if (filters.brokerType) {
    params.set("broker", filters.brokerType);
  }

  if (filters.foodPreference) {
    params.set("food", filters.foodPreference);
  }

  if (filters.lifestyle) {
    params.set("lifestyle", filters.lifestyle);
  }

  if (filters.propertyTypes.length > 0) {
    params.set("property", filters.propertyTypes.join(","));
  }

  if (filters.amenities.length > 0) {
    params.set("amenities", filters.amenities.join(","));
  }

  return params;
};

/**
 * Decode URL parameters to filters
 */
export const urlParamsToFilters = (params: URLSearchParams): FilterState => {
  const defaultFilters = getDefaultFilters();

  const state = params.get("state") || defaultFilters.state;
  const area = params.get("area") || defaultFilters.area;
  const searchQuery = params.get("q") || "";

  const localities = params.get("localities")?.split(",").filter(Boolean) || [];

  let budget: [number, number] = defaultFilters.budget;
  const budgetParam = params.get("budget");
  if (budgetParam && budgetParam.includes("-")) {
    const [min, max] = budgetParam.split("-").map(Number);
    if (!isNaN(min) && !isNaN(max)) {
      budget = [min, max];
    }
  }

  const gender = params.get("gender") || "";
  const brokerType = params.get("broker") || "";
  const foodPreference = params.get("food") || "";
  const lifestyle = params.get("lifestyle") || "";

  const propertyTypes =
    params.get("property")?.split(",").filter(Boolean) || [];
  const amenities = params.get("amenities")?.split(",").filter(Boolean) || [];

  return {
    state,
    area,
    searchQuery,
    localities,
    budget,
    gender,
    brokerType,
    foodPreference,
    lifestyle,
    propertyTypes,
    amenities,
  };
};

/**
 * Apply filters to a list of listings
 */
export const applyFilters = (
  listings: Listing[],
  filters: FilterState
): Listing[] => {
  return listings.filter((listing) => {
    // Search query - check title and location
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [listing.title, listing.location, listing.locality]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    // Locality filter
    if (filters.localities.length > 0) {
      if (!filters.localities.includes(listing.locality)) {
        return false;
      }
    }

    // Budget filter
    if (listing.rent < filters.budget[0] || listing.rent > filters.budget[1]) {
      return false;
    }

    // Gender filter
    if (
      filters.gender &&
      listing.gender !== "unisex" &&
      listing.gender !== filters.gender
    ) {
      return false;
    }

    // Broker type filter
    if (filters.brokerType && listing.brokerType !== filters.brokerType) {
      return false;
    }

    // Food preference filter
    if (filters.foodPreference && listing.foodPreference) {
      if (
        listing.foodPreference !== "both" &&
        listing.foodPreference !== filters.foodPreference
      ) {
        return false;
      }
    }

    // Lifestyle filter
    if (filters.lifestyle && listing.lifestyle) {
      if (
        listing.lifestyle !== "no_preference" &&
        listing.lifestyle !== filters.lifestyle
      ) {
        return false;
      }
    }

    // Property type filter
    if (filters.propertyTypes.length > 0) {
      if (!filters.propertyTypes.includes(listing.propertyType)) {
        return false;
      }
    }

    // Amenities filter - listing must have all selected amenities
    if (filters.amenities.length > 0) {
      const hasAllAmenities = filters.amenities.every((amenity) =>
        listing.amenities.includes(amenity)
      );
      if (!hasAllAmenities) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Get filter summary text
 */
export const getFilterSummary = (filters: FilterState): string => {
  const parts: string[] = [];

  if (filters.localities.length > 0) {
    parts.push(`${filters.localities.length} localities`);
  }

  if (filters.gender) {
    parts.push(`${filters.gender} preference`);
  }

  if (filters.brokerType === "owner") {
    parts.push("owner direct");
  } else if (filters.brokerType === "broker") {
    parts.push("broker listings");
  }

  if (filters.foodPreference) {
    parts.push(`${filters.foodPreference.replace("_", " ")} food`);
  }

  if (filters.lifestyle && filters.lifestyle !== "no_preference") {
    parts.push(`${filters.lifestyle.replace("_", " ")} friendly`);
  }

  if (filters.propertyTypes.length > 0) {
    parts.push(`${filters.propertyTypes.length} property types`);
  }

  if (filters.amenities.length > 0) {
    parts.push(`${filters.amenities.length} amenities`);
  }

  if (parts.length === 0) {
    return "All listings";
  }

  return `Filtered by ${parts.join(", ")}`;
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => func(...args), wait);
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString("en-IN")}`;
};

/**
 * Format budget range for display
 */
export const formatBudgetRange = (min: number, max: number): string => {
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
};

/**
 * Get localities for a given area (mock data - replace with API)
 */
export const getLocalitiesForArea = async (
  state: string,
  area: string
): Promise<string[]> => {
  // Mock implementation - replace with actual API call
  const localitiesMap: Record<string, Record<string, string[]>> = {
    Telangana: {
      Hyderabad: [
        "Gachibowli",
        "Hitec City",
        "Kondapur",
        "Kukatpally",
        "Madhapur",
        "Banjara Hills",
        "Jubilee Hills",
        "Begumpet",
        "Secunderabad",
        "Ameerpet",
        "Dilsukhnagar",
        "LB Nagar",
        "Uppal",
        "Miyapur",
        "Bachupally",
        "Nizampet",
        "Manikonda",
        "Tolichowki",
        "Mehdipatnam",
        "Attapur",
      ],
    },
  };

  return localitiesMap[state]?.[area] || [];
};

/**
 * Validate filter values
 */
export const validateFilters = (
  filters: Partial<FilterState>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (filters.budget) {
    const [min, max] = filters.budget;
    if (min < 0 || max < 0) {
      errors.push("Budget values must be positive");
    }
    if (min >= max) {
      errors.push("Minimum budget must be less than maximum budget");
    }
  }

  if (
    filters.gender &&
    !["male", "female", "unisex"].includes(filters.gender)
  ) {
    errors.push("Invalid gender preference");
  }

  if (filters.brokerType && !["owner", "broker"].includes(filters.brokerType)) {
    errors.push("Invalid broker type");
  }

  if (
    filters.foodPreference &&
    !["vegetarian", "non_vegetarian", "both"].includes(filters.foodPreference)
  ) {
    errors.push("Invalid food preference");
  }

  if (
    filters.lifestyle &&
    !["smoker", "non_smoker", "no_preference"].includes(filters.lifestyle)
  ) {
    errors.push("Invalid lifestyle preference");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
