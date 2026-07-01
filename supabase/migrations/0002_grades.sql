-- Per-assignment grading
-- Adds points_earned / points_possible to assignments so course grades can be
-- computed from real per-assignment scores instead of a single manual `grade` field.

alter table assignments
  add column if not exists points_earned numeric,
  add column if not exists points_possible numeric;

-- No new RLS policy needed: "Users manage own assignments" already covers
-- select/insert/update/delete on the assignments table, including these columns.
