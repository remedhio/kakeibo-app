-- Lock down Data API privileges and close self-join household membership.
-- Login is required; anon should not be able to read or write public tables.

revoke all on table public.households from anon;
revoke all on table public.household_members from anon;
revoke all on table public.categories from anon;
revoke all on table public.entries from anon;
revoke all on table public.v_monthly_totals from anon;

revoke all on table public.households from authenticated;
revoke all on table public.household_members from authenticated;
revoke all on table public.categories from authenticated;
revoke all on table public.entries from authenticated;
revoke all on table public.v_monthly_totals from authenticated;

grant select, insert, update, delete on table public.households to authenticated;
grant select, insert, update, delete on table public.household_members to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;
grant select, insert, update, delete on table public.entries to authenticated;
grant select on table public.v_monthly_totals to authenticated;

-- Previous policy allowed any authenticated user to insert themselves into any
-- household (and choose a role). Household sharing is unused; deny inserts
-- until an owner-only invite flow exists. With RLS enabled and no INSERT
-- policy, membership inserts are denied by default.
drop policy if exists members_insert on public.household_members;
