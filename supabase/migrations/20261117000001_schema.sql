-- Redlace schema: catalogue, stock, customers, orders, messages, promo codes, newsletter.
-- Row level security everywhere; anything that must be trusted (prices, stock, totals) happens
-- inside security-definer functions, never in the browser.

-- ---------------------------------------------------------------- customers
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- every new sign-up gets a profile
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- only an admin may hand out (or take away) admin rights from the app
create function public.protect_admin_flag()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.is_admin is distinct from old.is_admin and auth.uid() is not null and not public.is_admin() then
    raise exception 'NOT_ALLOWED';
  end if;
  return new;
end;
$$;
create trigger protect_admin_flag before update on public.profiles
  for each row execute function public.protect_admin_flag();

-- ---------------------------------------------------------------- catalogue
create table public.products (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand text not null,
  name text not null,
  colorway text not null,
  type text not null check (type in ('Low-top', 'High-top', 'Runner')),
  price integer not null check (price > 0),
  mrp integer not null,
  year integer check (year between 1900 and 2100),
  is_new boolean not null default false,
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  reviews integer not null default 0 check (reviews >= 0),
  blurb text not null default '',
  details text[] not null default '{}',
  image_url text,
  spin_frames integer not null default 0 check (spin_frames between 0 and 36),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mrp_not_below_price check (mrp >= price)
);

create table public.inventory (
  product_id text not null references public.products (id) on delete cascade on update cascade,
  size integer not null check (size between 3 and 15),
  stock integer not null default 0 check (stock >= 0),
  primary key (product_id, size)
);

create table public.promo_codes (
  code text primary key check (code ~ '^[A-Z0-9]{3,20}$'),
  percent integer not null check (percent between 1 and 90),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  name text not null,
  phone text not null,
  address text not null,
  city text not null,
  pin text not null,
  speed text not null check (speed in ('standard', 'express')),
  pay_method text not null check (pay_method in ('UPI', 'Card', 'Net banking', 'Cash on delivery')),
  status text not null default 'placed'
    check (status in ('placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
  subtotal integer not null default 0,
  discount integer not null default 0,
  delivery integer not null default 0,
  total integer not null default 0,
  promo_code text,
  eta timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_id_idx on public.orders (user_id);
create index orders_created_at_idx on public.orders (created_at desc);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null on update cascade,
  brand text not null,
  name text not null,
  colorway text not null,
  image text,
  size integer not null,
  qty integer not null check (qty between 1 and 6),
  price integer not null
);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- ---------------------------------------------------------------- contact + newsletter
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 120),
  email text not null check (length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  topic text not null check (topic in ('A size or a shoe', 'An order', 'A return', 'Something else')),
  order_number text check (length(order_number) <= 20),
  message text not null check (length(message) between 10 and 5000),
  status text not null default 'new' check (status in ('new', 'replied')),
  created_at timestamptz not null default now()
);

create table public.subscribers (
  email text primary key check (length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- housekeeping
create function public.touch_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- row level security
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.promo_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.messages enable row level security;
alter table public.subscribers enable row level security;

create policy "Own profile or admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "Edit own profile or admin" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "Shop shows live products" on public.products for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy "Admins add products" on public.products for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit products" on public.products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete products" on public.products for delete to authenticated using ((select public.is_admin()));

create policy "Anyone sees stock" on public.inventory for select to anon, authenticated using (true);
create policy "Admins add stock" on public.inventory for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit stock" on public.inventory for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete stock" on public.inventory for delete to authenticated using ((select public.is_admin()));

create policy "Admins manage promo codes" on public.promo_codes for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Own orders or admin" on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins edit orders" on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Items of visible orders" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or (select public.is_admin()))));

create policy "Anyone can write to us" on public.messages for insert to anon, authenticated
  with check (status = 'new');
create policy "Admins read messages" on public.messages for select to authenticated using ((select public.is_admin()));
create policy "Admins update messages" on public.messages for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete messages" on public.messages for delete to authenticated using ((select public.is_admin()));

create policy "Anyone can subscribe" on public.subscribers for insert to anon, authenticated
  with check (created_at > now() - interval '1 minute');
create policy "Admins read subscribers" on public.subscribers for select to authenticated using ((select public.is_admin()));
create policy "Admins remove subscribers" on public.subscribers for delete to authenticated using ((select public.is_admin()));
