import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type State = {
  id: string;
  name: string;
  created_at: string;
};

export type Area = {
  id: string;
  name: string;
  state_id: string;
  created_at: string;
};

export type Flat = {
  id: string;
  title: string;
  location: string;
  rent: number;
  image_url: string;
  images?: Array<{ url: string; public_id?: string; is_primary?: boolean }>;
  room_type: string;
  tags: string[];
  created_at: string;
};

export type Flatmate = {
  id: string;
  name: string;
  age: number;
  gender: string;
  company: string;
  budget_min: number;
  budget_max: number;
  non_smoker: boolean;
  food_preference: "Veg" | "Non-Veg" | "Vegan";
  gated_community: boolean;
  amenities: string[];
  preferred_locations: string[];
  image_url: string;
  created_at: string;
};

export type FlatmatePreferences = {
  gender: string;
  smoker: boolean;
  food: string;
  pets: boolean;
};

export type Listing = {
  id: string;
  user_id: string;
  user_type: "normal" | "broker";
  title: string;
  property_type: string;
  location: string;
  area_sqft?: number;
  floor?: number;
  description?: string;
  highlights: string[];
  rent: number;
  maintenance?: number;
  security_deposit: number;
  expenses?: string;
  flatmate_preferences: FlatmatePreferences;
  contact_number: string;
  image_urls: string[];
  status: "active" | "inactive" | "rented";
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
};

export type ChatListItem = {
  other_user_id: string;
  other_user_email: string | null;
  latest_message: string | null;
  latest_message_time: string | null;
  unread_count: number;
  is_sender: boolean;
};

export type ConversationMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
  sender_email: string | null;
};
