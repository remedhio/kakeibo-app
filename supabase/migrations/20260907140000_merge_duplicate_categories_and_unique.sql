-- Merge duplicate personal categories, then enforce uniqueness at the database layer.
-- Mirrors lib/categories.ts dedupeCategories (canonical = lowest order, then id).
-- Safe to re-run: dedupe steps no-op when no duplicates; indexes use IF NOT EXISTS.
--
-- Apply after schema.sql (and optional harden migration) on existing projects.
-- New projects: schema.sql already includes the unique indexes at the end.

begin;

create temp table _category_dedupe_map (
  dupe_id uuid primary key,
  canonical_id uuid not null
) on commit drop;

-- ---------------------------------------------------------------------------
-- 1) Parent duplicates: (user_id, type, trim(name)) where parent_id IS NULL
-- ---------------------------------------------------------------------------

insert into _category_dedupe_map (dupe_id, canonical_id)
with ranked as (
  select
    id,
    first_value(id) over w as canonical_id,
    row_number() over w as rn
  from public.categories
  where parent_id is null
    and household_id is null
  window w as (
    partition by user_id, type, trim(name)
    order by coalesce("order", 2147483647), id
  )
)
select id, canonical_id
from ranked
where rn > 1;

update public.categories c
set parent_id = m.canonical_id
from _category_dedupe_map m
where c.parent_id = m.dupe_id
  and c.household_id is null;

update public.entries e
set category_id = m.canonical_id
from _category_dedupe_map m
where e.category_id = m.dupe_id
  and e.household_id is null;

delete from public.categories c
using _category_dedupe_map m
where c.id = m.dupe_id;

-- ---------------------------------------------------------------------------
-- 2) Child duplicates: (user_id, parent_id, trim(name)) — two passes
-- ---------------------------------------------------------------------------

truncate _category_dedupe_map;

insert into _category_dedupe_map (dupe_id, canonical_id)
with ranked as (
  select
    id,
    first_value(id) over w as canonical_id,
    row_number() over w as rn
  from public.categories
  where parent_id is not null
    and household_id is null
  window w as (
    partition by user_id, parent_id, trim(name)
    order by coalesce("order", 2147483647), id
  )
)
select id, canonical_id
from ranked
where rn > 1;

update public.entries e
set category_id = m.canonical_id
from _category_dedupe_map m
where e.category_id = m.dupe_id
  and e.household_id is null;

delete from public.categories c
using _category_dedupe_map m
where c.id = m.dupe_id;

truncate _category_dedupe_map;

insert into _category_dedupe_map (dupe_id, canonical_id)
with ranked as (
  select
    id,
    first_value(id) over w as canonical_id,
    row_number() over w as rn
  from public.categories
  where parent_id is not null
    and household_id is null
  window w as (
    partition by user_id, parent_id, trim(name)
    order by coalesce("order", 2147483647), id
  )
)
select id, canonical_id
from ranked
where rn > 1;

update public.entries e
set category_id = m.canonical_id
from _category_dedupe_map m
where e.category_id = m.dupe_id
  and e.household_id is null;

delete from public.categories c
using _category_dedupe_map m
where c.id = m.dupe_id;

-- ---------------------------------------------------------------------------
-- 3) Unique indexes (personal mode only)
-- ---------------------------------------------------------------------------

create unique index if not exists categories_unique_parent_personal
  on public.categories (user_id, type, trim(name))
  where parent_id is null and household_id is null;

create unique index if not exists categories_unique_child_personal
  on public.categories (user_id, parent_id, trim(name))
  where parent_id is not null and household_id is null;

commit;
