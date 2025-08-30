-- Create the flats table
CREATE TABLE flats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  rent INTEGER NOT NULL,
  image_url TEXT,
  room_type TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO flats (title, location, rent, image_url, room_type, tags) VALUES
('Modern 2BHK in Koramangala', 'Koramangala, Bangalore', 25000, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop', '2BHK', '{"Furnished", "Pet friendly", "Balcony"}'),
('Spacious 1BHK near Metro', 'Indiranagar, Bangalore', 18000, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop', '1BHK', '{"Semi-furnished", "Metro nearby", "Parking"}'),
('Luxury 3BHK with Pool', 'Whitefield, Bangalore', 45000, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop', '3BHK', '{"Fully furnished", "Swimming pool", "Gym", "Security"}'),
('Cozy Studio Apartment', 'HSR Layout, Bangalore', 12000, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500&h=300&fit=crop', 'Studio', '{"Furnished", "WiFi", "Kitchen"}'),
('Family 2BHK with Garden', 'Electronic City, Bangalore', 20000, 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=500&h=300&fit=crop', '2BHK', '{"Semi-furnished", "Garden", "Pet friendly", "Parking"}'),
('Modern 1BHK in IT Hub', 'Bellandur, Bangalore', 22000, 'https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=500&h=300&fit=crop', '1BHK', '{"Fully furnished", "Tech park nearby", "AC", "WiFi"}'