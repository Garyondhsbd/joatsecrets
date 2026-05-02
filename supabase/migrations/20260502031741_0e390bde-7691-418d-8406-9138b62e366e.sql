
create or replace function public.validate_order()
returns trigger language plpgsql as $$
begin
  if length(new.full_name) > 200 or length(new.full_name) < 2 then
    raise exception 'invalid full_name length';
  end if;
  if length(new.email) > 320 or new.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email';
  end if;
  if length(new.phone) > 40 or length(new.phone) < 7 then
    raise exception 'invalid phone';
  end if;
  if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) = 0 or jsonb_array_length(new.items) > 50 then
    raise exception 'invalid items';
  end if;
  if new.total_cents < 0 or new.total_cents > 100000000 then
    raise exception 'invalid total';
  end if;
  if length(coalesce(new.notes,'')) > 2000 then
    raise exception 'notes too long';
  end if;
  -- force safe defaults regardless of client input
  new.status := 'pending';
  new.email_relay_status := 'queued';
  return new;
end $$;

create trigger orders_validate
  before insert on public.orders
  for each row execute function public.validate_order();
