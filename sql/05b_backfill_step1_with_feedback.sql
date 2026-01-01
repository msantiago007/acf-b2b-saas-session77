-- =====================================================
-- Step 1 ONLY: Backfill with Feedback
-- =====================================================

-- Backfill existing auth.users to public.users
INSERT INTO public.users (id, email, created_at)
SELECT
  id,
  email,
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email;

-- Show what was synced
SELECT
  'SYNC COMPLETE' as status,
  COUNT(*) as users_synced
FROM public.users
WHERE id IN (SELECT id FROM auth.users);

-- Show the actual synced users
SELECT
  u.id,
  u.email,
  u.created_at,
  CASE
    WHEN au.id IS NOT NULL THEN '✅ Synced from auth.users'
    ELSE '⚠️  Only in public.users (no auth record)'
  END as sync_status
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
ORDER BY sync_status, u.email;
