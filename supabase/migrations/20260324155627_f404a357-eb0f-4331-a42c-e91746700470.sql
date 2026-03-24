ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'trial';