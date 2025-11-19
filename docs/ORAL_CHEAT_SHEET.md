# NoshNurture — Oral Exam Cheat-sheet (One page)

Quick facts & one-line answers you can say in an oral

Project in one line
- Inventory app to track home food items, compute expiry, suggest recipes and reduce waste.

Main features
- Add/import items, compute days-until-expiry, label items (fresh / caution / warning / expired), recipe suggestions, Vkart import/sync and in-app expiry alerts.

Tech stack (one-liners)
- Framework: Next.js (app-router) + TypeScript
- DB/Auth: Supabase (tables in `database-schema.sql`)
- Styling: Tailwind CSS
- Tests: Vitest

Where to find core logic (file pointers)
- Expiry calculation: `src/lib/productUtils.ts` → `daysUntilExpiry(expiryDate)`
- Status mapping used on insert/import: `src/app/api/inventory/update/route.ts` and `src/app/api/vkart-sync/route.ts` (`mapStatus`)
- Alert UI: `src/components/ExpiryAlert.tsx`
- DB schema: `database-schema.sql` (status CHECK, indexed)

Exact expiry->status mapping (copy-paste answer)
- expired: days < 0 (expiry date before today)
- warning: 0 ≤ days ≤ 3 (including "expires today")
- caution: 4 ≤ days ≤ 7
- fresh: days > 7

One-line answers for common follow-ups
- How are days computed? → Math.floor((expiry - today) / (1000*60*60*24)) in `daysUntilExpiry`.
- Timezone/partial-day nuance? → Uses JS Date; partial days are floored so 1.9 days → 1 day.
- Missing expiry behavior? → Currently defaults to days = 0 and expiry_date = now on insert, so becomes `warning`.
- Where is status stored? → `inventory_items.status` in Supabase (database-schema.sql) and indexed for filters.
- How imports map status? → `vkart-sync` uses `enhanceProductData` then `mapStatus` and inserts `status` before storing.
- How to change thresholds? → Centralize mapping into an exported helper and/or env vars; provide a backfill script for DB if you want existing rows updated.
- Best quick fix for missing expiry? → Treat missing expiry as `unknown` (add status) or keep it as `warning` if you want to force user attention.

Edge cases to mention (one-liners)
- Items without expiry being marked `warning` by default can be surprising to users.
- Time-of-day and timezone differences can shift an item from `fresh` → `warning` depending on local time vs stored ISO string.
- Partial-day flooring means items expiring later today count as 0 days remaining.

One-minute elevator pitch (say this in 30s)
- "NoshNurture helps household users track food inventory, automatically calculates days until expiry, categorizes items into fresh/caution/warning/expired using simple thresholds, and suggests recipes — all backed by Supabase and importable from external order systems."

Notes to prepare for follow-ups
- Be ready to explain where you'd centralize thresholds (one helper in `src/lib`) and how you'd backfill the DB safely (one-off script run in maintenance window).
- If asked about notifications, mention in-app alerts already exist (`ExpiryAlert`) and you can add email/push with opt-in.

---
Small print: open `docs/ORAL_CHEAT_SHEET.md` to print or convert to PDF. Use `pandoc` or your editor's print-to-PDF feature.
