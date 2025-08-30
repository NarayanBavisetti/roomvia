import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Flat = {
  id: string
  title: string
  location: string
  rent: number
  image_url: string
  room_type: string
  tags: string[]
  created_at: string
}

export type Flatmate = {
  id: string
  name: string
  age: number
  gender: string
  company: string
  budget_min: number
  budget_max: number
  non_smoker: boolean
  food_preference: 'Veg' | 'Non-Veg' | 'Vegan'
  gated_community: boolean
  amenities: string[]
  preferred_locations: string[]
  image_url: string
  created_at: string
}