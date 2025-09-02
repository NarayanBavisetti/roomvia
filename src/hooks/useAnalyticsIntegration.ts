"use client";

import { useRef } from "react";
import { trackEvent } from "@/lib/analytics-extraction";

// Session ID for anonymous tracking
let sessionId: string | null = null;

const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
  return sessionId;
};

// Hook to automatically track user interactions
export function useAnalyticsIntegration() {
  const lastTrackedRef = useRef<string>("");

  // Track page views
  const trackPageView = (page: string, metadata?: Record<string, unknown>) => {
    const key = `pageview_${page}`;
    if (lastTrackedRef.current === key) return;
    lastTrackedRef.current = key;

    trackEvent({
      event_type: "profile_view",
      metadata: { page, ...metadata },
      session_id: getSessionId(),
    });
  };

  // Track search events
  const trackSearch = (searchParams: {
    city?: string;
    state?: string;
    property_type?: string;
    budget_min?: number;
    budget_max?: number;
  }) => {
    trackEvent({
      event_type: "search",
      ...searchParams,
      session_id: getSessionId(),
    });
  };

  // Track filter applications
  const trackFilterApply = (
    filters: Record<string, unknown>,
    location?: { city?: string; state?: string }
  ) => {
    trackEvent({
      event_type: "filter_apply",
      city: location?.city,
      state: location?.state,
      filters_applied: filters,
      session_id: getSessionId(),
    });
  };

  // Track listing views
  const trackListingView = (
    listingId: string,
    listingData: {
      property_type?: string;
      city?: string;
      state?: string;
      rent?: number;
    }
  ) => {
    trackEvent({
      event_type: "listing_view",
      target_listing_id: listingId,
      property_type: listingData.property_type,
      city: listingData.city,
      state: listingData.state,
      metadata: { rent: listingData.rent },
      session_id: getSessionId(),
    });
  };

  // Track saves
  const trackSave = (
    targetId: string,
    targetType: "listing" | "flatmate",
    metadata?: Record<string, unknown>
  ) => {
    trackEvent({
      event_type: "save",
      target_listing_id: targetType === "listing" ? targetId : undefined,
      target_user_id: targetType === "flatmate" ? targetId : undefined,
      metadata,
      session_id: getSessionId(),
    });
  };

  // Track messages sent
  const trackMessage = (
    targetUserId: string,
    listingId?: string,
    metadata?: Record<string, unknown>
  ) => {
    trackEvent({
      event_type: "message_sent",
      target_user_id: targetUserId,
      target_listing_id: listingId,
      metadata,
      session_id: getSessionId(),
    });
  };

  // Track phone reveals
  const trackPhoneReveal = (
    listingId: string,
    metadata?: Record<string, unknown>
  ) => {
    trackEvent({
      event_type: "phone_reveal",
      target_listing_id: listingId,
      metadata,
      session_id: getSessionId(),
    });
  };

  return {
    trackPageView,
    trackSearch,
    trackFilterApply,
    trackListingView,
    trackSave,
    trackMessage,
    trackPhoneReveal,
    sessionId: getSessionId(),
  };
}
