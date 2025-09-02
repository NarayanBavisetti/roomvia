# Cloudinary Image Upload Integration Setup Guide

## 🎯 Overview

This guide walks you through setting up Cloudinary image uploads for your Roomvia listing form. The integration replaces the old file-based image handling with a professional cloud-based solution.

## 📋 Prerequisites

1. Cloudinary account (free tier available)
2. Supabase project with authentication set up
3. Next.js application with the provided code

## 🚀 Quick Setup Steps

### 1. Install Dependencies

```bash
npm install cloudinary @supabase/auth-helpers-nextjs
```

### 2. Environment Variables Setup

Add these variables to your `.env.local` file:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**To get your Cloudinary credentials:**
1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Find your Cloud Name, API Key, and API Secret in the Dashboard
3. Copy them to your `.env.local` file

### 3. Create Cloudinary Upload Preset

1. Go to Cloudinary Console → Settings → Upload
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Configure:
   - **Preset name**: `roomvia_listings`
   - **Signing Mode**: `Unsigned` ✅ (Important!)
   - **Folder**: `listings` (optional, but recommended)
   - **Allowed formats**: `jpg,jpeg,png,webp`
   - **Transformation**: 
     - Quality: `auto:good`
     - Format: `auto`
     - Max dimensions: `1200x800`

### 4. Update Supabase Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Add the new images column (jsonb array)
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]';

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_listings_images_primary 
ON listings USING gin ((images::jsonb)) 
WHERE images IS NOT NULL;

-- Add computed column for easy access to primary image
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS primary_image_url text 
GENERATED ALWAYS AS (
  (SELECT (image->>'url')::text
   FROM jsonb_array_elements(images) AS image
   WHERE (image->>'is_primary')::boolean = true
   LIMIT 1)
) STORED;

-- Optional: Migrate existing image_urls data (if you have any)
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
```

### 5. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to your add listing page
3. Try uploading images via drag & drop or file selection
4. Verify images appear in your Cloudinary Media Library
5. Submit a test listing and check the database

## 🏗️ What's Included

### ✅ Files Created/Modified:

1. **`src/lib/cloudinary.ts`** - Cloudinary utilities and upload functions
2. **`src/app/api/upload/route.ts`** - Server-side upload API endpoint
3. **`src/components/image-upload.tsx`** - Drag & drop image upload component
4. **`src/app/add-listing/page.tsx`** - Updated form integration
5. **`package.json`** - Added Cloudinary dependencies
6. **`.env.example`** - Added Cloudinary environment variables
7. **`supabase_schema_update.sql`** - Database schema updates

### ✅ Features Implemented:

- **Drag & Drop Upload** - Users can drag images directly onto the upload area
- **Progress Tracking** - Real-time upload progress indicators
- **Image Preview** - Instant previews of uploaded images
- **Primary Image Selection** - Users can mark one image as primary
- **Image Removal** - Delete images before form submission
- **Validation** - File type, size, and count validation
- **Error Handling** - User-friendly error messages
- **Responsive Design** - Works on all device sizes

## 🔧 Configuration Options

### Upload Component Props:

```tsx
<ImageUpload
  images={formData.images}           // Current images array
  onImagesChange={handleImagesChange} // Callback when images change
  maxImages={10}                     // Maximum number of images
  disabled={isSubmitting}            // Disable during form submission
  listingId="optional-id"            // For organizing uploads
/>
```

### Cloudinary Settings:

- **Max file size**: 5MB per image
- **Supported formats**: JPG, JPEG, PNG, WebP
- **Auto optimization**: Quality and format optimization enabled
- **Organized storage**: Images stored in `listings/{user_id}/{listing_id}/` folders

## 🎨 UI/UX Features

- **Modern drag & drop interface** with visual feedback
- **Grid layout** for uploaded images
- **Primary image indicator** with star icon
- **Hover actions** for delete and set primary
- **Upload progress bars** with percentage
- **Responsive grid** that adapts to screen size

## 📊 Database Structure

Images are stored as JSON objects in Supabase:

```json
[
  {
    "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/listings/user123/listing456/image1.jpg",
    "public_id": "listings/user123/listing456/image1",
    "width": 1200,
    "height": 800,
    "format": "jpg",
    "bytes": 245760,
    "is_primary": true
  }
]
```

## 🚨 Troubleshooting

### Common Issues:

1. **Upload fails with 401 error**
   - Check if your upload preset is set to "Unsigned"
   - Verify Cloudinary cloud name in environment variables

2. **Images not appearing**
   - Check browser network tab for upload errors
   - Verify Cloudinary credentials are correct

3. **Database errors**
   - Ensure you've run the SQL schema update
   - Check that the user is authenticated

4. **TypeScript errors**
   - Run `npm install` to ensure all dependencies are installed
   - Restart your TypeScript server

### Debug Mode:

Enable detailed logging by adding to your component:

```tsx
console.log('Form data images:', formData.images)
console.log('Upload response:', result)
```

## 🌟 Next Steps

1. **Test thoroughly** with different image types and sizes
2. **Customize styling** to match your brand
3. **Add image optimization** settings in Cloudinary
4. **Set up monitoring** for upload failures
5. **Consider adding image editing** features

## 📞 Support

- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Issues**: For bug reports and feature requests

---

🎉 **Congratulations!** Your image upload system is now ready for production use with professional cloud storage and optimization.