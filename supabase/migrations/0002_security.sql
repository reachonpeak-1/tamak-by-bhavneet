-- Security hardening migration (run after 0001_init.sql).

-- C2: idempotency — at most one order per Razorpay payment. The verify route
-- relies on this unique index to collapse replays to a single order row.
create unique index if not exists orders_payment_id_uq
  on orders ((data->>'paymentId'))
  where (data->>'paymentId') is not null;

-- H2: atomic, race-safe stock decrement. Called from the paid-order write.
-- Each line is decremented only if enough stock remains; ids that could not be
-- satisfied are returned so the order can be flagged `needsRestock`.
create or replace function decrement_stock(lines jsonb)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  l jsonb;
  failed text[] := '{}';
begin
  for l in select * from jsonb_array_elements(lines) loop
    update products
      set data = jsonb_set(
        data,
        '{stock}',
        to_jsonb(greatest(0, coalesce((data->>'stock')::int, 0) - (l->>'qty')::int))
      )
      where id = l->>'id'
        and coalesce((data->>'stock')::int, 0) >= (l->>'qty')::int;
    if not found then
      failed := failed || (l->>'id');
    end if;
  end loop;
  return failed;
end
$$;
