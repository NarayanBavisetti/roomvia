-- Create the listings table
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('normal', 'broker')),
  title TEXT NOT NULL,
  property_type TEXT NOT NULL,
  location TEXT NOT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample listing data
INSERT INTO listings (
  user_type, 
  title, 
  property_type, 
  location, 
  area_sqft, 
  floor, 
  description, 
  highlights, 
  rent, 
  maintenance, 
  security_deposit, 
  expenses,
  flatmate_preferences,
  contact_number, 
  image_urls
) VALUES
(
  'normal',
  'Spacious 3BHK in Madhapur, Siddhi Vinayak Nagar',
  '3BHK',
  'Madhapur, Siddhi Vinayak Nagar',
  2500,
  2,
  'Looking for a cool, easy-going third roommate to join our fully furnished 3BHK in Madhapur. Well-connected location with 12 mins to Knowledge City Sattva and Mindspace, 15 mins to Gachibowli & Kondapur.',
  '{"Lift", "Security", "Fully Furnished", "AC", "WiFi"}',
  18166,
  0,
  36332,
  'Electricity, Wi-Fi, Gas: Split equally, Maid service: 1k, Furniture Rental: 3k',
  '{"gender": "Male", "smoker": false, "food": "Any", "pets": true}',
  '+91 8220147153',
  '{"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop"}'
),
(
  'broker',
  'Modern 2BHK Apartment in Koramangala',
  '2BHK',
  'Koramangala 5th Block',
  1200,
  4,
  'Premium 2BHK apartment with modern amenities in the heart of Koramangala. Close to restaurants, cafes, and metro connectivity.',
  '{"Gym", "Swimming Pool", "Parking", "Balcony", "Lift"}',
  28000,
  3000,
  56000,
  'Maintenance included in rent',
  '{"gender": "Any", "smoker": false, "food": "Veg", "pets": false}',
  '+91 9876543210',
  '{"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop"}'
);

-- Create indexes for better performance
CREATE INDEX idx_listings_property_type ON listings(property_type);
CREATE INDEX idx_listings_location ON listings(location);
CREATE INDEX idx_listings_rent ON listings(rent);
CREATE INDEX idx_listings_created_at ON listings(created_at);
CREATE INDEX idx_listings_user_type ON listings(user_type);