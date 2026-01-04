# Rapid-fire Mock Oral — 10 Questions (with scoring)

Instructions
- Timebox: 60–90 seconds per question.
- Scoring: 0 = incorrect/blank, 1 = partial, 2 = mostly-correct, 3 = correct with concise rationale.
- Passing target: 24/30 (80%). Aim for 27+ for confidence.

Questions (answer aloud, then check answer key below)
1. Where is the expiry calculation implemented and how does it compute days?  
2. Show the exact mapping from days to status and state the thresholds.  
3. What happens currently when an item has no `expiry_date`?  
4. If an item says "Expires today" which status will it have? Why?  
5. Which files handle status mapping for imports and manual updates?  
6. How would you change thresholds to be configurable via environment variables? Briefly outline steps.  
7. Describe one bug a user might report about status assignment and how you'd debug it.  
8. How does the app avoid importing a user's entire Vkart history on first sync?  
9. If you change thresholds in code, how should existing DB rows be handled? What are the options?  
10. Name two unit tests you would write to validate expiry/status logic.

Scoring rubric (apply per question)
- 3 points: Correct answer + exact file/function reference + brief rationale.
- 2 points: Correct thresholds or behavior but missing file reference or minor detail.
- 1 point: Partial or vague answer.
- 0 points: Wrong or no answer.

Answer key (short answers for self-check)
1. `src/lib/productUtils.ts` → `daysUntilExpiry(expiryDate)` uses Math.floor((expiry - today) / (1000*60*60*24)).
2. expired: days < 0; warning: days ≤ 3; caution: days ≤ 7; fresh: > 7. (Used in `update/route.ts` and `vkart-sync/route.ts`).
3. Insert route defaults `days_until_expiry = 0` on missing/invalid expiry and sets `expiry_date` to now, so status becomes `warning`.
4. "Expires today" gives days = 0 → `warning` because mapping uses <= 3 for warning and flooring of partial days.
5. `src/app/api/inventory/update/route.ts` and `src/app/api/vkart-sync/route.ts` (`mapStatus`).
6. Export a helper `mapStatus(days)` and read thresholds from env vars (e.g., WARNING_DAYS, CAUTION_DAYS), replace inline logic, add tests and optionally a settings UI.
7. Example bug: "Item marked expired overnight." Debug: fetch the item's `expiry_date` from DB, run `daysUntilExpiry` locally, check timezone and whether `expiry_date` was defaulted to now in the insert route.
8. It reads `vkart_sync.last_synced_at`, adjusts by a small window (default 24h), passes `updated_since`, and on first sync only imports the latest order by default.
9. Options: run a backfill script to recompute and update `status` for all rows (recommended for consistency), or keep old values and apply new mapping on reads only. Backfill requires a maintenance window.
10. Tests: (a) `daysUntilExpiry` with dates at boundaries (today, tomorrow, 3 days, 7 days, negative) and (b) `mapStatus` mapping tests for each threshold including negative and missing values.

Practice tips
- Speak file names and functions exactly (e.g., `daysUntilExpiry` in `src/lib/productUtils.ts`).
- For design questions, state the trade-off (simplicity vs configurability) and suggest a low-risk rollout (feature flag + backfill + tests).

Good luck — run through this twice and you'll be ready.