
CREATE TABLE public.video_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Video',
  template text NOT NULL,
  character_id uuid REFERENCES public.characters(id),
  product_image_url text,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_video_url text,
  total_duration integer NOT NULL DEFAULT 0,
  aspect_ratio text NOT NULL DEFAULT '9:16',
  model text NOT NULL DEFAULT 'veo3_fast',
  with_dialogue boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video projects"
ON public.video_projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video projects"
ON public.video_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video projects"
ON public.video_projects FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own video projects"
ON public.video_projects FOR DELETE
USING (auth.uid() = user_id);
