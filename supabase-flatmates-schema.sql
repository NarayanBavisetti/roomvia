-- Create the flatmates table
CREATE TABLE flatmates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  company TEXT NOT NULL,
  budget_min INTEGER NOT NULL,
  budget_max INTEGER NOT NULL,
  non_smoker BOOLEAN DEFAULT true,
  food_preference TEXT NOT NULL CHECK (food_preference IN ('Veg', 'Non-Veg', 'Vegan')),
  gated_community BOOLEAN DEFAULT false,
  amenities TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);