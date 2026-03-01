
-- Add new columns to generations table
ALTER TABLE public.generations 
  ADD COLUMN IF NOT EXISTS character_id uuid,
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'kie_ai',
  ADD COLUMN IF NOT EXISTS model text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to product-images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow public read access
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images');
