-- Add area_id column to listings table
ALTER TABLE listings ADD COLUMN area_id UUID REFERENCES areas(id);

-- Add area column for storing area name directly (for easier queries and backward compatibility)
ALTER TABLE listings ADD COLUMN area TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_area_id ON listings(area_id);
CREATE INDEX IF NOT EXISTS idx_listings_area ON listings(area);
CREATE INDEX IF NOT EXISTS idx_listings_location_with_area ON listings(city, area, state);

-- Update existing listings - this is optional and can be run manually
-- UPDATE listings SET area = 'Unknown' WHERE area IS NULL;