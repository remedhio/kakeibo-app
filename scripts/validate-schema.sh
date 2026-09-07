#!/usr/bin/env bash
# Validates that supabase/schema.sql defines columns and objects referenced by the app.
set -euo pipefail

SCHEMA="${1:-supabase/schema.sql}"

if [[ ! -f "$SCHEMA" ]]; then
  echo "Missing $SCHEMA" >&2
  exit 1
fi

content="$(cat "$SCHEMA")"

require() {
  local label="$1"
  local pattern="$2"
  if ! grep -qE "$pattern" <<<"$content"; then
    echo "FAIL: $label (pattern: $pattern)" >&2
    exit 1
  fi
  echo "OK: $label"
}

require "categories table" 'create table if not exists public\.categories'
require "entries table" 'create table if not exists public\.entries'
require "households table" 'create table if not exists public\.households'
require "household_members table" 'create table if not exists public\.household_members'
require "v_monthly_totals view" 'create or replace view public\.v_monthly_totals'

# App-used columns (lib/categories.ts, app/(tabs)/*)
for col in user_id household_id parent_id '"order"' happened_on category_id created_at; do
  require "column $col" "$col"
done

require "categories RLS" 'enable row level security'
require "entries_select_personal policy" 'entries_select_personal'
require "anon revoke" 'revoke all on table public\.categories from anon'

echo "Schema validation passed."
