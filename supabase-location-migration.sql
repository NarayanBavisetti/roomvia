-- Migration to replace single location field with separate city, state, country fields
-- This script updates the listings table to have structured location data

BEGIN;

-- Step 1: Add new columns for city, state, country
ALTER TABLE listings 
ADD COLUMN city TEXT,
ADD COLUMN state TEXT, 
ADD COLUMN country TEXT DEFAULT 'India';

-- Step 2: Migrate existing location data to new columns
-- Parse the existing location data and populate new columns
UPDATE listings SET 
  city = CASE 
    WHEN position(',' in location) > 0 THEN trim(split_part(location, ',', 1))
    ELSE trim(location)
  END,
  state = CASE 
    WHEN position(',' in location) > 0 THEN trim(split_part(location, ',', 2))
    WHEN trim(lower(location)) LIKE '%bangalore%' OR trim(lower(location)) LIKE '%bengaluru%' THEN 'Karnataka'
    WHEN trim(lower(location)) LIKE '%mumbai%' THEN 'Maharashtra'
    WHEN trim(lower(location)) LIKE '%delhi%' THEN 'Delhi'
    WHEN trim(lower(location)) LIKE '%pune%' THEN 'Maharashtra'
    WHEN trim(lower(location)) LIKE '%hyderabad%' THEN 'Telangana'
    WHEN trim(lower(location)) LIKE '%chennai%' THEN 'Tamil Nadu'
    WHEN trim(lower(location)) LIKE '%kolkata%' THEN 'West Bengal'
    WHEN trim(lower(location)) LIKE '%ahmedabad%' THEN 'Gujarat'
    WHEN trim(lower(location)) LIKE '%koramangala%' THEN 'Karnataka'
    WHEN trim(lower(location)) LIKE '%madhapur%' THEN 'Telangana'
    ELSE ''
  END,
  country = 'India';

-- Step 3: Make city and state required (after data migration)
ALTER TABLE listings 
ALTER COLUMN city SET NOT NULL,
ALTER COLUMN state SET NOT NULL,
ALTER COLUMN country SET NOT NULL;

-- Step 4: Create indexes for new location columns
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_state ON listings(state);
CREATE INDEX idx_listings_country ON listings(country);
CREATE INDEX idx_listings_location_combined ON listings(city, state, country);

-- Step 5: Drop old location column and its index
DROP INDEX IF EXISTS idx_listings_location;
ALTER TABLE listings DROP COLUMN location;

-- Step 6: Update any existing data with better state mappings
UPDATE listings SET state = 'Karnataka' WHERE city ILIKE '%bangalore%' OR city ILIKE '%bengaluru%' OR city ILIKE '%koramangala%';
UPDATE listings SET state = 'Maharashtra' WHERE city ILIKE '%mumbai%' OR city ILIKE '%pune%';
UPDATE listings SET state = 'Delhi' WHERE city ILIKE '%delhi%';
UPDATE listings SET state = 'Telangana' WHERE city ILIKE '%hyderabad%' OR city ILIKE '%madhapur%';
UPDATE listings SET state = 'Tamil Nadu' WHERE city ILIKE '%chennai%';
UPDATE listings SET state = 'West Bengal' WHERE city ILIKE '%kolkata%';
UPDATE listings SET state = 'Gujarat' WHERE city ILIKE '%ahmedabad%';

-- Step 7: Clean up city names (remove state info if it got duplicated)
UPDATE listings SET city = regexp_replace(city, ',.*$', '', 'g');
UPDATE listings SET city = trim(city);

COMMIT;

-- Verify the migration worked
SELECT id, city, state, country FROM listings LIMIT 5;