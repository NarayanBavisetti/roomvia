-- Update listings table to replace image_urls with images column
-- This stores Cloudinary image objects with metadata

-- First, let's see the current structure (run this in Supabase SQL editor to check)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'listings';

-- Add the new images column (jsonb array)
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]';

-- Optional: Migrate existing image_urls data to new images format
-- This converts the old string array to CloudinaryImage objects
-- Run this only if you have existing data you want to preserve
UPDATE listings 
SET images = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'url', url_value,
      'public_id', '',
      'width', 800,
      'height', 600,
      'format', 'jpg',
      'bytes', 0,
      'is_primary', (array_position(image_urls, url_value) = 1)
    )
  )
  FROM unnest(image_urls) AS url_value
)
WHERE image_urls IS NOT NULL AND array_length(image_urls, 1) > 0;

-- Optional: Drop the old image_urls column (only after verifying migration)
-- ALTER TABLE listings DROP COLUMN IF EXISTS image_urls;

-- Create an index on the images column for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_images_primary 
ON listings USING gin ((images::jsonb)) 
WHERE images IS NOT NULL;

-- Add a constraint to ensure at least one image for active listings
-- ALTER TABLE listings 
-- ADD CONSTRAINT check_active_listings_have_images 
-- CHECK (
--   status != 'active' OR 
--   (images IS NOT NULL AND jsonb_array_length(images) > 0)
-- );

-- Function to get primary image URL from images jsonb
CREATE OR REPLACE FUNCTION get_primary_image_url(images_jsonb jsonb)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT (image->>'url')::text
    FROM jsonb_array_elements(images_jsonb) AS image
    WHERE (image->>'is_primary')::boolean = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get all image URLs from images jsonb
CREATE OR REPLACE FUNCTION get_image_urls(images_jsonb jsonb)
RETURNS text[] AS $$
BEGIN
  RETURN (
    SELECT ARRAY(
      SELECT (image->>'url')::text
      FROM jsonb_array_elements(images_jsonb) AS image
      ORDER BY (image->>'is_primary')::boolean DESC
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Update the listings view or add computed columns if needed
-- This example adds a computed column for easy access to primary image
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS primary_image_url text 
GENERATED ALWAYS AS (get_primary_image_url(images)) STORED;

-- Example queries to use after migration:

-- Get listings with their primary image
-- SELECT id, title, primary_image_url, images FROM listings WHERE status = 'active';

-- Get listings with all image URLs
-- SELECT id, title, get_image_urls(images) as all_image_urls FROM listings;

-- Get listings where primary image exists
-- SELECT * FROM listings WHERE get_primary_image_url(images) IS NOT NULL;

-- Update primary image for a listing
-- UPDATE listings 
-- SET images = (
--   SELECT jsonb_agg(
--     CASE 
--       WHEN image->>'public_id' = 'new_primary_public_id' 
--       THEN jsonb_set(image, '{is_primary}', 'true')
--       ELSE jsonb_set(image, '{is_primary}', 'false')
--     END
--   )
--   FROM jsonb_array_elements(images) AS image
-- )
-- WHERE id = 'listing_id';

COMMENT ON COLUMN listings.images IS 'Array of Cloudinary image objects with url, public_id, dimensions, and is_primary flag';
COMMENT ON COLUMN listings.primary_image_url IS 'Computed column that returns the URL of the primary image';