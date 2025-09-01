-- Safe migration to replace single location field with separate city, state, country fields
-- This script checks for existing columns before making changes

BEGIN;

-- Check and add columns only if they don't exist
DO $$ 
BEGIN
    -- Add city column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'listings' AND column_name = 'city') THEN
        ALTER TABLE listings ADD COLUMN city TEXT;
    END IF;
    
    -- Add state column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'listings' AND column_name = 'state') THEN
        ALTER TABLE listings ADD COLUMN state TEXT;
    END IF;
    
    -- Add country column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'listings' AND column_name = 'country') THEN
        ALTER TABLE listings ADD COLUMN country TEXT DEFAULT 'India';
    END IF;
END $$;

-- Only migrate data if the old location column still exists and new columns are empty
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'listings' AND column_name = 'location') THEN
        
        -- Update city column from location data (only if city is null/empty)
        UPDATE listings SET 
          city = CASE 
            WHEN position(',' in location) > 0 THEN trim(split_part(location, ',', 1))
            ELSE trim(location)
          END
        WHERE city IS NULL OR city = '';
        
        -- Update state column from location data (only if state is null/empty)
        UPDATE listings SET 
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
          END
        WHERE state IS NULL OR state = '';
        
        -- Update country column (only if country is null/empty)
        UPDATE listings SET country = 'India' WHERE country IS NULL OR country = '';
        
    END IF;
END $$;

-- Make columns required only if they have data
DO $$
BEGIN
    -- Check if we can safely make city NOT NULL
    IF NOT EXISTS (SELECT 1 FROM listings WHERE city IS NULL OR city = '') THEN
        ALTER TABLE listings ALTER COLUMN city SET NOT NULL;
    END IF;
    
    -- Check if we can safely make state NOT NULL
    IF NOT EXISTS (SELECT 1 FROM listings WHERE state IS NULL OR state = '') THEN
        ALTER TABLE listings ALTER COLUMN state SET NOT NULL;
    END IF;
    
    -- Country should always be safe to make NOT NULL since we default it
    ALTER TABLE listings ALTER COLUMN country SET NOT NULL;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_listings_city') THEN
        CREATE INDEX idx_listings_city ON listings(city);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_listings_state') THEN
        CREATE INDEX idx_listings_state ON listings(state);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_listings_country') THEN
        CREATE INDEX idx_listings_country ON listings(country);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_listings_location_combined') THEN
        CREATE INDEX idx_listings_location_combined ON listings(city, state, country);
    END IF;
END $$;

-- Clean up city names (remove state info if it got duplicated)
UPDATE listings SET city = regexp_replace(city, ',.*$', '', 'g') WHERE city LIKE '%,%';
UPDATE listings SET city = trim(city) WHERE city != trim(city);

-- Update any remaining empty states with better mappings
UPDATE listings SET state = 'Karnataka' 
WHERE (state IS NULL OR state = '') 
  AND (city ILIKE '%bangalore%' OR city ILIKE '%bengaluru%' OR city ILIKE '%koramangala%');

UPDATE listings SET state = 'Maharashtra' 
WHERE (state IS NULL OR state = '') 
  AND (city ILIKE '%mumbai%' OR city ILIKE '%pune%');

UPDATE listings SET state = 'Delhi' 
WHERE (state IS NULL OR state = '') 
  AND city ILIKE '%delhi%';

UPDATE listings SET state = 'Telangana' 
WHERE (state IS NULL OR state = '') 
  AND (city ILIKE '%hyderabad%' OR city ILIKE '%madhapur%');

UPDATE listings SET state = 'Tamil Nadu' 
WHERE (state IS NULL OR state = '') 
  AND city ILIKE '%chennai%';

UPDATE listings SET state = 'West Bengal' 
WHERE (state IS NULL OR state = '') 
  AND city ILIKE '%kolkata%';

UPDATE listings SET state = 'Gujarat' 
WHERE (state IS NULL OR state = '') 
  AND city ILIKE '%ahmedabad%';

-- Only drop the old location column if all new columns have data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'listings' AND column_name = 'location')
       AND NOT EXISTS (SELECT 1 FROM listings WHERE city IS NULL OR city = '' OR state IS NULL OR state = '') THEN
        
        -- Drop old index first
        DROP INDEX IF EXISTS idx_listings_location;
        
        -- Drop old column
        ALTER TABLE listings DROP COLUMN location;
        
        RAISE NOTICE 'Successfully migrated location data and removed old location column';
    ELSE
        RAISE NOTICE 'Keeping old location column - some data may need manual review';
    END IF;
END $$;

COMMIT;

-- Show current state of location data
SELECT 
    id, 
    city, 
    state, 
    country,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'listings' AND column_name = 'location') 
         THEN 'location column still exists' 
         ELSE 'location column removed' 
    END as migration_status
FROM listings 
ORDER BY created_at DESC 
LIMIT 5;