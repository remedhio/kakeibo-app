-- kakeibo-app bootstrap schema
--
-- Source: reverse-engineered from app queries (lib/categories.ts, app/(tabs)/*),
-- supabase/migrations/20260828150000_harden_grants_and_member_insert.sql,
-- and recovered fragments (add_category_hierarchy.sql, add_category_order.sql in git history).
-- Supabase MCP export was unavailable; compare against your production DB if you have one.
--
-- Apply order for a new project:
--   1. Run this file in Supabase SQL Editor
--   2. Run supabase/migrations/20260828150000_harden_grants_and_member_insert.sql
--
-- Household sharing tables exist for future use; the app currently uses only rows
-- where household_id IS NULL (personal mode).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid references public.households (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  parent_id uuid references public.categories (id) on delete cascade,
  "order" integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid references public.households (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  happened_on date not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- View (read-only monthly aggregates; not yet used by the app UI)
-- ---------------------------------------------------------------------------

create or replace view public.v_monthly_totals
with (security_invoker = true)
as
select
  e.user_id,
  e.household_id,
  date_trunc('month', e.happened_on::timestamp)::date as month_start,
  e.type,
  coalesce(sum(e.amount), 0)::numeric(14, 2) as total_amount,
  count(*)::bigint as entry_count
from public.entries e
group by
  e.user_id,
  e.household_id,
  date_trunc('month', e.happened_on::timestamp),
  e.type;

-- ---------------------------------------------------------------------------
-- Indexes (aligned with app query patterns)
-- ---------------------------------------------------------------------------

create index if not exists categories_parent_id_idx on public.categories (parent_id);
create index if not exists categories_user_id_type_idx
  on public.categories (user_id, type)
  where parent_id is null;
create index if not exists categories_order_idx
  on public.categories (user_id, type, parent_id, "order");
create index if not exists categories_user_household_idx
  on public.categories (user_id, household_id);

create index if not exists entries_user_happened_on_idx
  on public.entries (user_id, happened_on desc);
create index if not exists entries_category_id_idx on public.entries (category_id);
create index if not exists entries_user_household_happened_idx
  on public.entries (user_id, household_id, happened_on desc);

create index if not exists household_members_user_id_idx
  on public.household_members (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.categories enable row level security;
alter table public.entries enable row level security;

-- Personal mode (household_id IS NULL) — used by the app today.
-- Policy names are stable so follow-up migrations can drop/replace them.

drop policy if exists categories_select_personal on public.categories;
create policy categories_select_personal
  on public.categories for select
  using (auth.uid() = user_id and household_id is null);

drop policy if exists categories_insert_personal on public.categories;
create policy categories_insert_personal
  on public.categories for insert
  with check (auth.uid() = user_id and household_id is null);

drop policy if exists categories_update_personal on public.categories;
create policy categories_update_personal
  on public.categories for update
  using (auth.uid() = user_id and household_id is null)
  with check (auth.uid() = user_id and household_id is null);

drop policy if exists categories_delete_personal on public.categories;
create policy categories_delete_personal
  on public.categories for delete
  using (auth.uid() = user_id and household_id is null);

drop policy if exists entries_select_personal on public.entries;
create policy entries_select_personal
  on public.entries for select
  using (auth.uid() = user_id and household_id is null);

drop policy if exists entries_insert_personal on public.entries;
create policy entries_insert_personal
  on public.entries for insert
  with check (auth.uid() = user_id and household_id is null);

drop policy if exists entries_update_personal on public.entries;
create policy entries_update_personal
  on public.entries for update
  using (auth.uid() = user_id and household_id is null)
  with check (auth.uid() = user_id and household_id is null);

drop policy if exists entries_delete_personal on public.entries;
create policy entries_delete_personal
  on public.entries for delete
  using (auth.uid() = user_id and household_id is null);

-- Household tables: minimal policies for future sharing. The app does not call these yet.
-- members_insert is intentionally NOT created; see harden migration.

drop policy if exists households_select_member on public.households;
create policy households_select_member
  on public.households for select
  using (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = households.id
        and hm.user_id = auth.uid()
    )
  );

drop policy if exists household_members_select_own on public.household_members;
create policy household_members_select_own
  on public.household_members for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Privileges (post-hardening baseline; migration 20260828150000_* is idempotent)
-- ---------------------------------------------------------------------------

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

-- Planned (NOT applied): category UNIQUE constraints to replace client-side dedupe.
-- See supabase/migrations/DRAFT_unique_categories.sql.example
