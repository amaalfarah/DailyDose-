-- ============================================================
-- DailyDose+ — Supabase Database Setup
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. PROFILES (extends auth.users) ─────────────────────────────────────────
create table if not exists public.profiles (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  user_name             text unique not null,
  user_email            text unique not null,
  user_notification_pref text default 'all',
  user_timezone         text default 'UTC',
  dob                   text default '',
  created_at            timestamptz default now()
);

-- ── 2. MEDICATION ─────────────────────────────────────────────────────────────
create table if not exists public.medications (
  medication_id  uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(user_id) on delete cascade,
  med_name       text not null,
  dosage_amount  text not null,
  refill_date    date,
  frequency      text not null,
  med_time       text not null,
  cover_name     text,
  color          text default '#1fa97a',
  icon_name      text default 'pill',
  icon_category  text default 'medication',
  is_prn         boolean default false,
  is_active      boolean default true,
  created_at     timestamptz default now()
);

-- ── 3. REMINDER ───────────────────────────────────────────────────────────────
create table if not exists public.reminders (
  reminder_id    uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(user_id) on delete cascade,
  medication_id  uuid not null references public.medications(medication_id) on delete cascade,
  schedule_time  text not null,
  reminder_type  text default 'push',
  is_sent        boolean default false,
  created_at     timestamptz default now()
);

-- ── 4. MED_LOG_ENTRY ──────────────────────────────────────────────────────────
create table if not exists public.med_log_entries (
  log_id           uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(user_id) on delete cascade,
  medication_id    uuid not null references public.medications(medication_id) on delete cascade,
  taken_timestamp  timestamptz default now(),
  status           text default 'taken',
  logged_by        uuid references public.profiles(user_id),
  notes            text
);

-- ── 5. NOTIFICATION ───────────────────────────────────────────────────────────
create table if not exists public.notifications (
  notification_id  uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(user_id) on delete cascade,
  delivery_status  text default 'pending',
  message_content  text not null,
  created_at       timestamptz default now()
);

-- ── 6. CAREGIVER_USER_LINK ────────────────────────────────────────────────────
create table if not exists public.caregiver_user_links (
  caregiver_user_link_id  uuid primary key default gen_random_uuid(),
  caregiver_user_id       uuid not null references public.profiles(user_id) on delete cascade,
  patient_user_id         uuid not null references public.profiles(user_id) on delete cascade,
  caregiver_email         text not null,
  status                  text default 'pending',
  invite_token            text unique,
  invited_at              timestamptz default now(),
  accepted_at             timestamptz
);

-- ── Enable Row Level Security ─────────────────────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.medications        enable row level security;
alter table public.reminders          enable row level security;
alter table public.med_log_entries    enable row level security;
alter table public.notifications      enable row level security;
alter table public.caregiver_user_links enable row level security;

-- ── RLS Policies ─────────────────────────────────────────────────────────────

-- profiles: allow public username lookup (needed for login by username)
create policy "Public username lookup"
  on public.profiles for select using (true);

create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = user_id);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = user_id);

-- medications
create policy "Users manage own medications"
  on public.medications for all using (auth.uid() = user_id);

-- caregivers can read patient medications
create policy "Caregivers read patient medications"
  on public.medications for select using (
    exists (
      select 1 from public.caregiver_user_links
      where caregiver_user_id = auth.uid()
        and patient_user_id = medications.user_id
        and status = 'accepted'
    )
  );

-- reminders
create policy "Users manage own reminders"
  on public.reminders for all using (auth.uid() = user_id);

-- med_log_entries
create policy "Users manage own logs"
  on public.med_log_entries for all using (auth.uid() = user_id);

create policy "Caregivers read patient logs"
  on public.med_log_entries for select using (
    exists (
      select 1 from public.caregiver_user_links
      where caregiver_user_id = auth.uid()
        and patient_user_id = med_log_entries.user_id
        and status = 'accepted'
    )
  );

-- notifications
create policy "Users manage own notifications"
  on public.notifications for all using (auth.uid() = user_id);

-- caregiver_user_links
create policy "Users see own caregiver links"
  on public.caregiver_user_links for all
  using (auth.uid() = caregiver_user_id or auth.uid() = patient_user_id);

-- ── Auto-create profile trigger ───────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, user_email, user_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
