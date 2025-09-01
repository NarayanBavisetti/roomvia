-- Create the listings table
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('normal', 'broker')),
  title TEXT NOT NULL,
  property_type TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  area_sqft INTEGER,
  floor INTEGER,
  description TEXT,
  highlights TEXT[] DEFAULT '{}',
  rent INTEGER NOT NULL,
  maintenance INTEGER DEFAULT 0,
  security_deposit INTEGER NOT NULL,
  expenses TEXT,
  flatmate_preferences JSONB DEFAULT '{}',
  contact_number TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'rented')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_listings_property_type ON listings(property_type);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_state ON listings(state);
CREATE INDEX idx_listings_country ON listings(country);
CREATE INDEX idx_listings_location_combined ON listings(city, state, country);
CREATE INDEX idx_listings_rent ON listings(rent);
CREATE INDEX idx_listings_created_at ON listings(created_at);
CREATE INDEX idx_listings_user_type ON listings(user_type);