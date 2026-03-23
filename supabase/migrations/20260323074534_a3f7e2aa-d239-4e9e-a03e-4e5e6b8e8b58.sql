
-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt function
CREATE OR REPLACE FUNCTION public.encrypt_api_key(plain_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  enc_key TEXT;
BEGIN
  enc_key := COALESCE(
    current_setting('app.settings.GENBOX_ENCRYPTION_KEY', true),
    current_setting('app.encryption_key', true)
  );
  IF enc_key IS NULL OR enc_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  RETURN pgp_sym_encrypt(plain_key, enc_key);
END;
$$;

-- Decrypt function
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  enc_key TEXT;
BEGIN
  enc_key := COALESCE(
    current_setting('app.settings.GENBOX_ENCRYPTION_KEY', true),
    current_setting('app.encryption_key', true)
  );
  IF enc_key IS NULL OR enc_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  RETURN pgp_sym_decrypt(encrypted_key::bytea, enc_key);
END;
$$;

-- Save key RPC (upsert with encryption)
CREATE OR REPLACE FUNCTION public.save_user_api_key(p_provider TEXT, p_plain_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO public.user_api_keys (user_id, provider, encrypted_key, updated_at)
  VALUES (uid, p_provider, public.encrypt_api_key(p_plain_key), now())
  ON CONFLICT (user_id, provider)
  DO UPDATE SET encrypted_key = public.encrypt_api_key(p_plain_key), updated_at = now();
END;
$$;

-- Get keys RPC (decrypt for current user)
CREATE OR REPLACE FUNCTION public.get_user_api_keys()
RETURNS TABLE(provider TEXT, decrypted_key TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  RETURN QUERY
  SELECT k.provider, public.decrypt_api_key(k.encrypted_key) AS decrypted_key
  FROM public.user_api_keys k
  WHERE k.user_id = uid;
END;
$$;

-- Encrypt existing plaintext keys (detect by length < 200 AND not starting with pgp marker)
DO $$
DECLARE
  enc_key TEXT;
BEGIN
  enc_key := COALESCE(
    current_setting('app.settings.GENBOX_ENCRYPTION_KEY', true),
    current_setting('app.encryption_key', true)
  );
  IF enc_key IS NOT NULL AND enc_key != '' THEN
    UPDATE public.user_api_keys
    SET encrypted_key = pgp_sym_encrypt(encrypted_key, enc_key),
        updated_at = now()
    WHERE length(encrypted_key) < 200
      AND encrypted_key NOT LIKE '\xc3%';
  END IF;
END;
$$;

-- Revoke direct writes, force through RPC
REVOKE INSERT, UPDATE ON public.user_api_keys FROM authenticated;

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION public.save_user_api_key(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_api_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_api_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_api_key(TEXT) TO authenticated;
