-- 001_create_users.sql
-- Extends Supabase auth.users with app-specific profile data

CREATE TABLE public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL DEFAULT '',
  date_of_birth   DATE,
  account_type    TEXT NOT NULL DEFAULT 'primary' CHECK (account_type IN ('primary', 'caregiver')),
  push_token      TEXT,                        -- Expo push token for notifications
  language        TEXT NOT NULL DEFAULT 'en'  CHECK (language IN ('en', 'es', 'fr', 'ar')),
  privacy_mode    BOOLEAN NOT NULL DEFAULT FALSE,
  trial_start_date TIMESTAMPTZ,
  is_subscribed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Index for fast lookup by email
CREATE INDEX idx_users_email ON public.users(email);

COMMENT ON TABLE public.users IS 'App user profiles, extends auth.users';
