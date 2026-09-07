-- Atomic fixed-expense registration (all months in one transaction).
-- Falls back to client-side sequential insert when this function is not deployed.

create or replace function public.create_fixed_expense_entries(
  p_type text,
  p_amount numeric,
  p_category_id uuid,
  p_note text,
  p_happened_on_dates date[]
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  d date;
  inserted integer := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_type not in ('income', 'expense') then
    raise exception 'invalid entry type';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  if p_happened_on_dates is null or array_length(p_happened_on_dates, 1) is null then
    raise exception 'at least one date is required';
  end if;

  foreach d in array p_happened_on_dates loop
    insert into public.entries (
      type,
      amount,
      happened_on,
      category_id,
      note,
      user_id,
      household_id
    )
    values (
      p_type,
      p_amount,
      d,
      p_category_id,
      p_note,
      auth.uid(),
      null
    );
    inserted := inserted + 1;
  end loop;

  return inserted;
end;
$$;

revoke all on function public.create_fixed_expense_entries(text, numeric, uuid, text, date[]) from public;
grant execute on function public.create_fixed_expense_entries(text, numeric, uuid, text, date[]) to authenticated;
