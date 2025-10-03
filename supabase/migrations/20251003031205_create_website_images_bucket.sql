/*
  # Create Storage Bucket for Website Images

  1. Storage Setup
    - Create a public bucket named 'website-images' for storing uploaded images
    - Enable public access for easy image retrieval
    
  2. Security
    - Enable RLS on storage.objects table
    - Add policy to allow public read access to images
    - Add policy to allow anyone to upload images (you can restrict this later if needed)
*/

-- Create the storage bucket for website images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-images',
  'website-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for website images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to website images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to website images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from website images" ON storage.objects;

-- Allow public read access to images in the bucket
CREATE POLICY "Public read access for website images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'website-images');

-- Allow anyone to upload images to the bucket
CREATE POLICY "Allow public uploads to website images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'website-images');

-- Allow users to update their own uploads
CREATE POLICY "Allow public updates to website images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'website-images')
WITH CHECK (bucket_id = 'website-images');

-- Allow users to delete their own uploads
CREATE POLICY "Allow public deletes from website images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'website-images');