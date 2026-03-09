
CREATE TABLE public.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    uses_remaining INTEGER DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invite codes
CREATE POLICY "Admins can manage invite codes"
ON public.invite_codes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed existing codes
INSERT INTO public.invite_codes (code, is_active) VALUES
    ('GENBOX-EA', true),
    ('EARLYBIRD', true),
    ('BETAUSER', true);
