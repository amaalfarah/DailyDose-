-- 006_create_subscriptions.sql

CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status                  TEXT NOT NULL DEFAULT 'trialing'
                          CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  trial_start_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end_date          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date   TIMESTAMPTZ,
  amount_cents            INTEGER NOT NULL DEFAULT 499,  -- $4.99
  billing_interval        TEXT NOT NULL DEFAULT 'monthly'
                          CHECK (billing_interval IN ('monthly', 'annual')),
  external_subscription_id TEXT,   -- Stripe / RevenueCat ID
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create a trial subscription when a user is created
CREATE OR REPLACE FUNCTION public.create_trial_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id)
  VALUES (NEW.id);

  -- Also update users table with trial start
  UPDATE public.users
  SET trial_start_date = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_start_trial
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_trial_for_new_user();

-- View: is user's trial/subscription valid right now?
CREATE OR REPLACE VIEW public.user_access AS
SELECT
  u.id AS user_id,
  u.email,
  s.status,
  s.trial_end_date,
  s.subscription_end_date,
  CASE
    WHEN s.status = 'active' AND (s.subscription_end_date IS NULL OR s.subscription_end_date > NOW()) THEN TRUE
    WHEN s.status = 'trialing' AND s.trial_end_date > NOW() THEN TRUE
    ELSE FALSE
  END AS has_access,
  GREATEST(0, EXTRACT(DAY FROM s.trial_end_date - NOW()))::INT AS trial_days_remaining
FROM public.users u
LEFT JOIN public.subscriptions s ON s.user_id = u.id;

COMMENT ON TABLE public.subscriptions IS 'Trial and subscription status per user';
