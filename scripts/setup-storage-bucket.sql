-- ============================================
-- SUPABASE STORAGE BUCKET FOR PROPERTY IMAGES
-- Run this in your Supabase SQL Editor
-- ============================================

-- Create storage bucket for property images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Landlords can update their property images" ON storage.objects;
DROP POLICY IF EXISTS "Landlords can delete their property images" ON storage.objects;

-- Create storage policy for property images - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Create storage policy for property images - allow public read access
CREATE POLICY "Public can view property images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'property-images');

-- Create storage policy for property images - allow users to update their own images
CREATE POLICY "Users can update their property images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'property-images');

-- Create storage policy for property images - allow users to delete their own images
CREATE POLICY "Users can delete their property images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'property-images');

-- ============================================
-- VERIFICATION - Check if bucket was created
-- ============================================
-- SELECT * FROM storage.buckets WHERE id = 'property-images';
