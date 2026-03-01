
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  age_range TEXT NOT NULL DEFAULT '',
  style TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  gradient_from TEXT NOT NULL DEFAULT '',
  gradient_to TEXT NOT NULL DEFAULT '',
  is_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own characters" ON public.characters FOR SELECT USING (auth.uid() = user_id OR is_preset = true);
CREATE POLICY "Users can insert own characters" ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own characters" ON public.characters FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own characters" ON public.characters FOR DELETE USING (auth.uid() = user_id AND is_preset = false);
