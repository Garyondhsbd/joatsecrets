
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text not null,
  shipping_address jsonb not null,
  billing_address jsonb not null,
  items jsonb not null,
  total_cents integer not null,
  notes text,
  status text not null default 'pending',
  email_relay_status text not null default 'queued'
);

alter table public.orders enable row level security;

-- Anyone (incl. anon guests) can place an order
create policy "anyone can insert orders"
  on public.orders for insert
  to anon, authenticated
  with check (true);

-- No public read; owner reads via service role only (admin dashboard later)
create policy "no public read"
  on public.orders for select
  to anon, authenticated
  using (false);
