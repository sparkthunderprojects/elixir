# Elixir Points: built to scale globally

## Currencies
Points are the one global unit. Each currency has its own earn rate, its own fixed redeem value, and a reference rate to pounds (`gbp_rate`). Customers earn on what they actually paid; the ledger keeps the amount and currency, plus a £ value frozen at the time (`spend_gbp`) which drives tiers and reporting. There are no live exchange rates on points. Starter values (GBP, USD, EUR, CAD, AUD, JPY) are in the migration; tune them in the dashboard (`elixir_admin_save_currency`). The pound row follows programme settings.

Brand sites call `earn` with `{ source_ref, amount, currency, email, country? }` and `refund` with `{ order_ref, refund_ref, refund_amount, currency? }`. The older `spend_gbp` and `refund_gbp` forms still work and mean pounds.

## Fast balances
`elixir.member_balances` holds one row per member (balance, lifetime issued/redeemed, lifetime £ spend), updated by a trigger in the same transaction as every ledger entry. The ledger is still the source of truth. Run `elixir_admin_verify_balances()` on a schedule: it returns `[]` when every stored balance matches the ledger.

## Event outbox
Every ledger entry also writes a row to `elixir.events` (pending until `delivered_at` is set). Insights, personalised offers and partner dashboards should read from here, not the live tables. Delete delivered events on a schedule.

## Not built yet (planned, in this order)
1. Points expiry (needs earn buckets) and per-currency reward values, so a reward can be priced locally.
2. Monthly partitioning of the ledger, and reports from a read replica or summary tables (the dashboard's tier breakdown still reads a year of ledger in one pass).
3. API rate limits and key rotation on the Edge Function.
4. Moving the points API to its own service when traffic needs it.
