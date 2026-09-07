#!/usr/bin/env bash
# Fail the build when required public env vars are missing.
set -euo pipefail

missing=0
for var in EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required environment variable: $var" >&2
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  echo "Set variables in .env locally or in your hosting provider before building." >&2
  exit 1
fi

echo "Environment variables OK."
