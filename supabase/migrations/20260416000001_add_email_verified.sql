-- 1. Add column to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- 2. Backfill existing users who are already confirmed in auth.users
UPDATE public.users pu
SET email_verified = true
FROM auth.users au
WHERE pu.id = au.id AND au.email_confirmed_at IS NOT NULL;

-- 3. Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users SET email_verified = true WHERE id = NEW.id;
  ELSE
    UPDATE public.users SET email_verified = false WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_email_verified();
