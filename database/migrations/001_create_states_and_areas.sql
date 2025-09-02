-- Create states table
CREATE TABLE IF NOT EXISTS states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create areas table
CREATE TABLE IF NOT EXISTS areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  state_id UUID REFERENCES states(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(name, state_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_areas_state_id ON areas(state_id);
CREATE INDEX IF NOT EXISTS idx_states_name ON states(name);
CREATE INDEX IF NOT EXISTS idx_areas_name ON areas(name);

-- Insert sample Indian states
INSERT INTO states (name) VALUES 
  ('Andhra Pradesh'),
  ('Arunachal Pradesh'),
  ('Assam'),
  ('Bihar'),
  ('Chhattisgarh'),
  ('Goa'),
  ('Gujarat'),
  ('Haryana'),
  ('Himachal Pradesh'),
  ('Jharkhand'),
  ('Karnataka'),
  ('Kerala'),
  ('Madhya Pradesh'),
  ('Maharashtra'),
  ('Manipur'),
  ('Meghalaya'),
  ('Mizoram'),
  ('Nagaland'),
  ('Odisha'),
  ('Punjab'),
  ('Rajasthan'),
  ('Sikkim'),
  ('Tamil Nadu'),
  ('Telangana'),
  ('Tripura'),
  ('Uttar Pradesh'),
  ('Uttarakhand'),
  ('West Bengal'),
  ('Delhi'),
  ('Puducherry'),
  ('Chandigarh'),
  ('Dadra and Nagar Haveli and Daman and Diu'),
  ('Jammu and Kashmir'),
  ('Ladakh'),
  ('Lakshadweep'),
  ('Andaman and Nicobar Islands')
ON CONFLICT (name) DO NOTHING;

-- Insert sample areas for Karnataka (you can add more states and areas as needed)
INSERT INTO areas (name, state_id) 
SELECT area_name, s.id 
FROM (VALUES 
  ('Koramangala'),
  ('Indiranagar'),
  ('Whitefield'),
  ('HSR Layout'),
  ('Electronic City'),
  ('Bellandur'),
  ('Marathahalli'),
  ('BTM Layout'),
  ('Jayanagar'),
  ('Rajajinagar'),
  ('Malleshwaram'),
  ('Basavanagudi'),
  ('JP Nagar'),
  ('Banashankari'),
  ('Hebbal'),
  ('Yeshwanthpur'),
  ('Sarjapur'),
  ('Bommanahalli'),
  ('Yelahanka'),
  ('KR Puram')
) AS areas_data(area_name)
CROSS JOIN states s 
WHERE s.name = 'Karnataka'
ON CONFLICT (name, state_id) DO NOTHING;

-- Insert sample areas for Maharashtra
INSERT INTO areas (name, state_id) 
SELECT area_name, s.id 
FROM (VALUES 
  ('Bandra'),
  ('Andheri'),
  ('Powai'),
  ('Goregaon'),
  ('Malad'),
  ('Borivali'),
  ('Thane'),
  ('Navi Mumbai'),
  ('Worli'),
  ('Lower Parel'),
  ('Colaba'),
  ('Fort'),
  ('Dadar'),
  ('Prabhadevi'),
  ('Khar'),
  ('Santacruz'),
  ('Vile Parle'),
  ('Juhu'),
  ('Versova'),
  ('Kandivali')
) AS areas_data(area_name)
CROSS JOIN states s 
WHERE s.name = 'Maharashtra'
ON CONFLICT (name, state_id) DO NOTHING;

-- Insert sample areas for Delhi
INSERT INTO areas (name, state_id) 
SELECT area_name, s.id 
FROM (VALUES 
  ('Connaught Place'),
  ('Khan Market'),
  ('Hauz Khas'),
  ('Lajpat Nagar'),
  ('Karol Bagh'),
  ('Dwarka'),
  ('Gurgaon'),
  ('Noida'),
  ('Greater Noida'),
  ('Faridabad'),
  ('Rohini'),
  ('Pitampura'),
  ('Janakpuri'),
  ('Laxmi Nagar'),
  ('Saket'),
  ('Vasant Kunj'),
  ('Greater Kailash'),
  ('Defence Colony'),
  ('Green Park'),
  ('Nehru Place')
) AS areas_data(area_name)
CROSS JOIN states s 
WHERE s.name = 'Delhi'
ON CONFLICT (name, state_id) DO NOTHING;