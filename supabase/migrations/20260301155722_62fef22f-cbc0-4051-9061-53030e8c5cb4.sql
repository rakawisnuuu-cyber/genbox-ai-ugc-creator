
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS identity_prompt text DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS thumbnail_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS reference_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shot_metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
