CREATE TABLE public.prompt_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mode TEXT NOT NULL,
  title TEXT NOT NULL,
  json_output TEXT,
  natural_prompt TEXT,
  input_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompts"
  ON public.prompt_library FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts"
  ON public.prompt_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
  ON public.prompt_library FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);