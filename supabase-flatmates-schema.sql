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

-- Insert dummy data
INSERT INTO flatmates (name, age, gender, company, budget_min, budget_max, non_smoker, food_preference, gated_community, amenities, preferred_locations, image_url) VALUES
('Arjun Mehta', 27, 'Male', 'Google', 15000, 25000, true, 'Veg', true, '{"Gym", "WiFi", "Balcony"}', '{"Indiranagar", "Koramangala"}', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'),
('Priya Sharma', 24, 'Female', 'Deloitte', 12000, 20000, true, 'Non-Veg', false, '{"Parking", "Lift"}', '{"Whitefield", "Bellandur"}', 'https://images.unsplash.com/photo-1494790108755-2616b332c830?w=400&h=400&fit=crop&crop=face'),
('Rahul Verma', 29, 'Male', 'Swiggy', 18000, 30000, true, 'Vegan', true, '{"Gym", "Swimming Pool", "Clubhouse"}', '{"HSR Layout", "Sarjapur Road"}', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'),
('Sneha Kapoor', 26, 'Female', 'Infosys', 10000, 18000, true, 'Veg', true, '{"WiFi", "Balcony", "Laundry"}', '{"Marathahalli", "Outer Ring Road"}', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'),
('Vikram Singh', 25, 'Male', 'Microsoft', 20000, 35000, false, 'Non-Veg', true, '{"Gym", "WiFi", "Parking", "Security"}', '{"Koramangala", "BTM Layout"}', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face');