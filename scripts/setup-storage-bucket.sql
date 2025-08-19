-- Create storage bucket for property images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for property images - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Create storage policy for property images - allow public read access
CREATE POLICY "Public can view property images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'property-images');

-- Create storage policy for property images - allow landlords to update their own images
CREATE POLICY "Landlords can update their property images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy for property images - allow landlords to delete their own images
CREATE POLICY "Landlords can delete their property images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
