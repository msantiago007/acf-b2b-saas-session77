-- =====================================================
-- Step 1 Only: Create trigger function
-- =====================================================
-- This should work without elevated privileges

CREATE OR REPLACE FUNCTION public.sync_auth_user()
RETURNS TRIGGER
SECURITY DEFINER  -- Required to access auth schema from public schema
SET search_path = public  -- Explicitly set search path for security
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update user in public.users table
  INSERT INTO public.users (id, email, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = NEW.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_auth_user() IS
  'Automatically syncs auth.users to public.users table on INSERT/UPDATE';

-- Verify function was created
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'sync_auth_user';
