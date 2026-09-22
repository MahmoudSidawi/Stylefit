-- Admins can view accounts and edit profile fields; role and credentials remain protected.
create policy admin_profiles_read on public.users for select to authenticated
using (public.is_admin());
create policy admin_profiles_update on public.users for update to authenticated
using (public.is_admin()) with check (public.is_admin());
