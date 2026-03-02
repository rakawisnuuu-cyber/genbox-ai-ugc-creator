-- Add reference_photo_url column to characters table
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS reference_photo_url TEXT DEFAULT '';

-- Create character-packs storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('character-packs', 'character-packs', true) ON CONFLICT (id) DO NOTHING;

-- RLS policies for character-packs bucket
CREATE POLICY "Authenticated users can upload to character-packs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'character-packs');
CREATE POLICY "Public read access for character-packs" ON storage.objects FOR SELECT USING (bucket_id = 'character-packs');
CREATE POLICY "Users can delete own character-pack files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'character-packs' AND (storage.foldername(name))[1] = auth.uid()::text);