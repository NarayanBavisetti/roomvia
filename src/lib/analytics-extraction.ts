// Analytics extraction utilities for AI parsing data

export interface ParsedAnalyticsEntry {
  userId: string;
  originalText: string;
  originalTextLength: number;
  extractedFieldsCount: number;
  confidence: number;
  propertyType: string;
  location: string;
  rent: number;
  highlightsCount: number;
  hasContact: boolean;
  source: string;
  timestamp: string;
  extractedFields: string[];
  marketContext: string;
  suggestedImprovements: string[];
}

export interface AnalyticsInsights {
  totalListings: number;
  averageConfidence: number;
  mostCommonPropertyTypes: Array<{ type: string; count: number }>;
  popularLocations: Array<{ location: string; count: number }>;
  averageRent: number;
  rentRanges: Array<{ range: string; count: number }>;
  mostUsedAmenities: Array<{ amenity: string; count: number }>;
  parsingAccuracy: number;
  userEngagement: {
    totalUsers: number;
    averageListingsPerUser: number;
    mostActiveUsers: Array<{ userId: string; count: number }>;
  };
  trendingKeywords: Array<{ keyword: string; frequency: number }>;
  improvementSuggestions: Array<{ suggestion: string; frequency: number }>;
}

export class AnalyticsExtractor {
  /**
   * Extract comprehensive analytics insights from parsed listing data
   */
  static extractInsights(data: ParsedAnalyticsEntry[]): AnalyticsInsights {
    if (data.length === 0) {
      return this.getEmptyInsights();
    }

    const totalListings = data.length;
    const averageConfidence = data.reduce((sum, entry) => sum + entry.confidence, 0) / totalListings;

    // Property type analysis
    const propertyTypeCounts = this.countOccurrences(data, 'propertyType');
    const mostCommonPropertyTypes = Object.entries(propertyTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Location analysis
    const locationCounts = this.countOccurrences(data, 'location');
    const popularLocations = Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Rent analysis
    const validRents = data.filter(entry => entry.rent > 0).map(entry => entry.rent);
    const averageRent = validRents.length > 0 
      ? validRents.reduce((sum, rent) => sum + rent, 0) / validRents.length 
      : 0;

    const rentRanges = this.categorizeRentRanges(validRents);

    // Amenities analysis (from extracted fields and improvements)
    const amenitiesKeywords = this.extractAmenitiesKeywords(data);
    const mostUsedAmenities = Object.entries(amenitiesKeywords)
      .map(([amenity, count]) => ({ amenity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Parsing accuracy (confidence > 70 is considered good)
    const highConfidenceEntries = data.filter(entry => entry.confidence > 70);
    const parsingAccuracy = (highConfidenceEntries.length / totalListings) * 100;

    // User engagement
    const userCounts = this.countOccurrences(data, 'userId');
    const totalUsers = Object.keys(userCounts).length;
    const averageListingsPerUser = totalListings / totalUsers;
    const mostActiveUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Trending keywords from original text
    const trendingKeywords = this.extractTrendingKeywords(data);

    // Improvement suggestions analysis
    const improvementCounts: Record<string, number> = {};
    data.forEach(entry => {
      entry.suggestedImprovements.forEach(suggestion => {
        improvementCounts[suggestion] = (improvementCounts[suggestion] || 0) + 1;
      });
    });

    const improvementSuggestions = Object.entries(improvementCounts)
      .map(([suggestion, frequency]) => ({ suggestion, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      totalListings,
      averageConfidence,
      mostCommonPropertyTypes,
      popularLocations,
      averageRent,
      rentRanges,
      mostUsedAmenities,
      parsingAccuracy,
      userEngagement: {
        totalUsers,
        averageListingsPerUser,
        mostActiveUsers
      },
      trendingKeywords,
      improvementSuggestions
    };
  }

  /**
   * Get analytics data from localStorage (client-side)
   */
  static getStoredAnalyticsData(): ParsedAnalyticsEntry[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('roomvia_parsing_analytics');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
      return [];
    }
  }

  /**
   * Filter analytics data by date range
   */
  static filterByDateRange(
    data: ParsedAnalyticsEntry[], 
    startDate: Date, 
    endDate: Date
  ): ParsedAnalyticsEntry[] {
    return data.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Filter analytics data by user
   */
  static filterByUser(data: ParsedAnalyticsEntry[], userId: string): ParsedAnalyticsEntry[] {
    return data.filter(entry => entry.userId === userId);
  }

  /**
   * Get market trends over time
   */
  static getMarketTrends(data: ParsedAnalyticsEntry[]): Array<{
    month: string;
    averageRent: number;
    listingCount: number;
    averageConfidence: number;
  }> {
    const monthlyData: Record<string, { rents: number[], confidences: number[], count: number }> = {};

    data.forEach(entry => {
      const date = new Date(entry.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { rents: [], confidences: [], count: 0 };
      }

      if (entry.rent > 0) {
        monthlyData[monthKey].rents.push(entry.rent);
      }
      monthlyData[monthKey].confidences.push(entry.confidence);
      monthlyData[monthKey].count++;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        averageRent: data.rents.length > 0 
          ? data.rents.reduce((sum, rent) => sum + rent, 0) / data.rents.length 
          : 0,
        listingCount: data.count,
        averageConfidence: data.confidences.reduce((sum, conf) => sum + conf, 0) / data.confidences.length
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private static getEmptyInsights(): AnalyticsInsights {
    return {
      totalListings: 0,
      averageConfidence: 0,
      mostCommonPropertyTypes: [],
      popularLocations: [],
      averageRent: 0,
      rentRanges: [],
      mostUsedAmenities: [],
      parsingAccuracy: 0,
      userEngagement: {
        totalUsers: 0,
        averageListingsPerUser: 0,
        mostActiveUsers: []
      },
      trendingKeywords: [],
      improvementSuggestions: []
    };
  }

  private static countOccurrences(data: ParsedAnalyticsEntry[], field: keyof ParsedAnalyticsEntry): Record<string, number> {
    const counts: Record<string, number> = {};
    data.forEach(entry => {
      const value = String(entry[field]);
      if (value && value !== 'unknown') {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    return counts;
  }

  private static categorizeRentRanges(rents: number[]): Array<{ range: string; count: number }> {
    const ranges = {
      '< ₹10k': 0,
      '₹10k - ₹20k': 0,
      '₹20k - ₹30k': 0,
      '₹30k - ₹50k': 0,
      '₹50k - ₹75k': 0,
      '> ₹75k': 0
    };

    rents.forEach(rent => {
      if (rent < 10000) ranges['< ₹10k']++;
      else if (rent <= 20000) ranges['₹10k - ₹20k']++;
      else if (rent <= 30000) ranges['₹20k - ₹30k']++;
      else if (rent <= 50000) ranges['₹30k - ₹50k']++;
      else if (rent <= 75000) ranges['₹50k - ₹75k']++;
      else ranges['> ₹75k']++;
    });

    return Object.entries(ranges)
      .map(([range, count]) => ({ range, count }))
      .filter(item => item.count > 0);
  }

  private static extractAmenitiesKeywords(data: ParsedAnalyticsEntry[]): Record<string, number> {
    const amenities: Record<string, number> = {};
    const amenityKeywords = [
      'lift', 'security', 'gym', 'balcony', 'parking', 'furnished', 'ac', 'wifi',
      'swimming pool', 'clubhouse', 'garden', 'power backup', 'water supply',
      'metro', 'shopping mall', 'hospital', 'school', 'restaurant'
    ];

    data.forEach(entry => {
      const text = entry.originalText.toLowerCase();
      amenityKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          amenities[keyword] = (amenities[keyword] || 0) + 1;
        }
      });

      // Also check extracted fields
      entry.extractedFields.forEach(field => {
        const fieldLower = field.toLowerCase();
        amenityKeywords.forEach(keyword => {
          if (fieldLower.includes(keyword)) {
            amenities[keyword] = (amenities[keyword] || 0) + 1;
          }
        });
      });
    });

    return amenities;
  }

  private static extractTrendingKeywords(data: ParsedAnalyticsEntry[]): Array<{ keyword: string; frequency: number }> {
    const keywordCounts: Record<string, number> = {};
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall', 'this', 'that', 'these', 'those', 'a', 'an']);

    data.forEach(entry => {
      const words = entry.originalText
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word));

      words.forEach(word => {
        keywordCounts[word] = (keywordCounts[word] || 0) + 1;
      });
    });

    return Object.entries(keywordCounts)
      .map(([keyword, frequency]) => ({ keyword, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);
  }
}

export default AnalyticsExtractor;