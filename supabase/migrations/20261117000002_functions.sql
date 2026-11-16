-- Trusted operations the browser calls by name (supabase.rpc).

-- Is this promo code live? Returns the percent off, or null.
create function public.check_promo(code text)
returns integer
language sql stable security definer set search_path = ''
as $$
  select p.percent from public.promo_codes p where p.code = upper(trim(check_promo.code)) and p.active;
$$;

-- Place an order. Prices, promo, delivery and stock all come from the database, not the browser.
-- Any problem raises an error and rolls the whole order back, stock included.
create function public.place_order(payload jsonb)
returns table (order_id uuid, order_number text)
language plpgsql security definer set search_path = ''
as $$
declare
  v_item jsonb;
  v_prod public.products%rowtype;
  v_qty integer;
  v_size integer;
  v_sub integer := 0;
  v_pct integer := 0;
  v_disc integer;
  v_del integer;
  v_order uuid;
  v_num text;
  v_speed text := coalesce(payload ->> 'speed', 'standard');
  v_code text := upper(nullif(trim(payload ->> 'promo'), ''));
begin
  if jsonb_typeof(payload -> 'items') is distinct from 'array' or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'EMPTY_BAG';
  end if;
  if jsonb_array_length(payload -> 'items') > 20 then raise exception 'INVALID:items'; end if;
  if length(coalesce(trim(payload ->> 'name'), '')) < 2 then raise exception 'INVALID:name'; end if;
  if coalesce(payload ->> 'email', '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'INVALID:email'; end if;
  if coalesce(payload ->> 'phone', '') !~ '^\d{10}$' then raise exception 'INVALID:phone'; end if;
  if length(coalesce(trim(payload ->> 'address'), '')) < 6 then raise exception 'INVALID:address'; end if;
  if length(coalesce(trim(payload ->> 'city'), '')) < 2 then raise exception 'INVALID:city'; end if;
  if coalesce(payload ->> 'pin', '') !~ '^\d{6}$' then raise exception 'INVALID:pin'; end if;
  if v_speed not in ('standard', 'express') then raise exception 'INVALID:speed'; end if;
  if coalesce(payload ->> 'pay', '') not in ('UPI', 'Card', 'Net banking', 'Cash on delivery') then
    raise exception 'INVALID:pay';
  end if;

  if v_code is not null then
    select p.percent into v_pct from public.promo_codes p where p.code = v_code and p.active;
    if not found then raise exception 'INVALID_PROMO'; end if;
  end if;

  loop
    v_num := 'RL-' || (10000 + floor(random() * 90000))::int;
    exit when not exists (select 1 from public.orders o where o.number = v_num);
  end loop;

  insert into public.orders (number, user_id, email, name, phone, address, city, pin, speed, pay_method, eta)
  values (
    v_num, auth.uid(), lower(trim(payload ->> 'email')), trim(payload ->> 'name'), payload ->> 'phone',
    trim(payload ->> 'address'), trim(payload ->> 'city'), payload ->> 'pin', v_speed, payload ->> 'pay',
    now() + case when v_speed = 'express' then interval '1 day' else interval '3 days' end
  )
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(payload -> 'items') loop
    v_qty := (v_item ->> 'qty')::integer;
    v_size := (v_item ->> 'size')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 6 or v_size is null then raise exception 'INVALID:qty'; end if;

    select * into v_prod from public.products p where p.id = v_item ->> 'id' and p.active;
    if not found then raise exception 'UNAVAILABLE:%', v_item ->> 'id'; end if;

    update public.inventory inv set stock = inv.stock - v_qty
     where inv.product_id = v_prod.id and inv.size = v_size and inv.stock >= v_qty;
    if not found then raise exception 'OUT_OF_STOCK:%:%', v_prod.id, v_size; end if;

    insert into public.order_items (order_id, product_id, brand, name, colorway, image, size, qty, price)
    values (v_order, v_prod.id, v_prod.brand, v_prod.name, v_prod.colorway,
            coalesce(v_prod.image_url, '/assets/shoes/' || v_prod.id || '/main.webp'), v_size, v_qty, v_prod.price);
    v_sub := v_sub + v_prod.price * v_qty;
  end loop;

  v_disc := round(v_sub * v_pct / 100.0);
  v_del := case when v_speed = 'express' then 299 when v_sub - v_disc >= 4999 then 0 else 149 end;
  update public.orders o
     set subtotal = v_sub, discount = v_disc, delivery = v_del, total = v_sub - v_disc + v_del,
         promo_code = case when v_pct > 0 then v_code end
   where o.id = v_order;

  return query select v_order, v_num;
end;
$$;

-- Orders for the "Your orders" page: everything on the signed-in account,
-- plus guest orders this browser placed (by their unguessable ids).
create function public.get_orders(order_ids uuid[] default '{}')
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb)
  from (
    select o.id, o.number, o.status, o.created_at, o.eta, o.total, o.pay_method,
           (select coalesce(jsonb_agg(jsonb_build_object(
                     'product_id', i.product_id, 'brand', i.brand, 'name', i.name, 'colorway', i.colorway,
                     'image', i.image, 'size', i.size, 'qty', i.qty, 'price', i.price) order by i.id), '[]'::jsonb)
              from public.order_items i where i.order_id = o.id) as items
      from public.orders o
     where (auth.uid() is not null and o.user_id = auth.uid())
        or (o.user_id is null and o.id = any (coalesce(get_orders.order_ids, '{}')))
  ) x;
$$;

-- Admin: move an order along. Cancelling puts the pairs back on the shelf.
create function public.set_order_status(p_order_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_old text;
begin
  if not public.is_admin() then raise exception 'NOT_ALLOWED'; end if;
  if p_status not in ('placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled') then
    raise exception 'INVALID:status';
  end if;
  select o.status into v_old from public.orders o where o.id = p_order_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_old = p_status then return; end if;
  if v_old = 'cancelled' then raise exception 'ORDER_CANCELLED'; end if;

  if p_status = 'cancelled' then
    update public.inventory inv
       set stock = inv.stock + i.qty
      from (select oi.product_id, oi.size, sum(oi.qty)::integer as qty
              from public.order_items oi
             where oi.order_id = p_order_id and oi.product_id is not null
             group by oi.product_id, oi.size) i
     where inv.product_id = i.product_id and inv.size = i.size;
  end if;

  update public.orders o set status = p_status where o.id = p_order_id;
end;
$$;

revoke execute on function public.set_order_status(uuid, text) from anon;

-- ---------------------------------------------------------------- product photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Admins upload product photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins replace product photos" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins delete product photos" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
