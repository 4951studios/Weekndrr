-- Weekender schema. Paste into the Supabase SQL editor and run.
-- Every row is owned by a user and RLS makes rows invisible to everyone else.

create table if not exists public.saved_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id text not null,
  created_date timestamptz not null default now(),
  unique (user_id, trip_id)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id text not null,
  departure_city text,
  travel_dates jsonb,
  guests integer not null default 2,
  guest_info jsonb,
  booking_site text,
  flight_site text,
  total_paid numeric not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  confirmation_code text,
  created_date timestamptz not null default now()
);

alter table public.bookings add column if not exists flight_site text;

create index if not exists saved_trips_user_id_idx on public.saved_trips (user_id);
create index if not exists bookings_user_id_idx on public.bookings (user_id);

alter table public.saved_trips enable row level security;
alter table public.bookings enable row level security;

-- Owner-only access. auth.uid() is the signed-in user; anonymous requests match nothing.
create policy "saved_trips are private" on public.saved_trips
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "bookings are private" on public.bookings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
