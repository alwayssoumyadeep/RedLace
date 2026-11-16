-- Trigger helpers are never called over the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_admin_flag() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
-- Order status changes need a signed-in admin (also checked inside the function).
revoke execute on function public.set_order_status(uuid, text) from public, anon;
grant execute on function public.set_order_status(uuid, text) to authenticated;
-- Intentionally public: check_promo, place_order, get_orders (guest checkout) and
-- is_admin (row level security policies call it as the visitor's own role).
