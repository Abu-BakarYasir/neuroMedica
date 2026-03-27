# Supabase Migration Rules

This project uses a **shared Supabase database** for development and production.
Every migration MUST be safe to run on a live database with real users and data.

## File Structure

```
supabase/
  MIGRATION_RULES.md          # This file (read before writing any migration)
  schema.sql                  # Current full schema snapshot (read-only reference)
  migrations/
    001_create_conversations.sql
    002_create_messages.sql
    003_add_some_column.sql
    ...
```

## Naming Convention

```
{sequence}_{action}_{target}.sql
```

- **sequence**: 3-digit zero-padded number (`001`, `002`, `003`)
- **action**: what the migration does (`create`, `add`, `alter`, `drop`, `backfill`, `fix`)
- **target**: the table or feature name (`conversations`, `messages`, `user_profiles`)

Examples:
- `001_create_conversations.sql`
- `002_create_messages.sql`
- `003_add_archived_to_conversations.sql`
- `004_backfill_message_timestamps.sql`

## Golden Rules

### 1. NEVER destructive without a safety net

| Dangerous | Safe alternative |
|-----------|-----------------|
| `DROP TABLE` | Rename to `_deprecated_tablename`, drop in a later migration after verification |
| `DROP COLUMN` | Add `-- DEPRECATED` comment, stop reading/writing in code first, drop in a later migration |
| `ALTER COLUMN ... TYPE` (lossy) | Add new column, backfill, swap reads, drop old in next migration |
| `DELETE FROM` / `TRUNCATE` | Use `WHERE` clauses, never full table |
| `DROP POLICY` | Replace with updated policy in same transaction |

### 2. Always use IF EXISTS / IF NOT EXISTS

```sql
-- GOOD
create table if not exists public.my_table (...);
create index if not exists idx_my_index on public.my_table(...);
drop index if exists idx_old_index;

-- BAD (will crash if already exists or doesn't exist)
create table public.my_table (...);
drop index idx_old_index;
```

### 3. Always wrap in a transaction

```sql
begin;
  -- all changes here
commit;
```

If ANY statement fails, nothing gets applied. This prevents partial migrations.

### 4. Every migration must be idempotent

Running the same migration twice should produce the same result without errors.
Use `if not exists`, `create or replace`, `drop ... if exists` before recreating.

### 5. Always add RLS policies for new tables

Every new table that holds user data MUST have:
- `alter table public.X enable row level security;`
- At minimum: SELECT, INSERT, UPDATE, DELETE policies scoped to `auth.uid()`
- Use `exists (select 1 from ...)` for join-based policies (e.g., messages → conversations)

### 6. Backward-compatible column additions

```sql
-- GOOD: nullable or has default — existing code won't break
alter table public.conversations
  add column if not exists archived boolean not null default false;

-- BAD: NOT NULL without default — breaks all existing inserts
alter table public.conversations
  add column status text not null;
```

New columns MUST either:
- Be nullable (`text` without `not null`), OR
- Have a default value (`not null default false`)

### 7. Index naming convention

```
idx_{table}_{column(s)}
```

Examples: `idx_conversations_user_id`, `idx_messages_conversation_id`, `idx_messages_created_at`

### 8. Policy naming convention

```
{Users|Service} can {action} {description}
```

Examples:
- `"Users can select own conversations"`
- `"Users can insert messages in own conversations"`

### 9. No raw data changes without WHERE clauses

```sql
-- GOOD
update public.conversations set title = 'Untitled' where title is null;

-- BAD (updates every row in production)
update public.conversations set title = 'Untitled';
```

### 10. Migration header template

Every migration file MUST start with this header:

```sql
-- ============================================================
-- Migration: {sequence}_{action}_{target}
-- Description: {what this migration does}
-- Author: {name}
-- Date: {YYYY-MM-DD}
-- Depends on: {previous migration number or "none"}
--
-- Safety: [x] Idempotent  [x] Non-destructive  [x] Backward-compatible
-- ============================================================
```

## Migration Checklist (before running)

- [ ] File follows naming convention (`NNN_action_target.sql`)
- [ ] Header is filled out completely
- [ ] Wrapped in `begin; ... commit;`
- [ ] Uses `if not exists` / `if exists` everywhere
- [ ] New columns are nullable or have defaults
- [ ] RLS policies added for any new tables
- [ ] No `DROP TABLE` or `DROP COLUMN` on active tables
- [ ] No unscoped `UPDATE` or `DELETE` statements
- [ ] Tested on a local/staging Supabase instance first (if available)
- [ ] `schema.sql` updated to reflect the new state after migration

## How to Apply

1. Open **Supabase Dashboard > SQL Editor**
2. Paste the migration SQL
3. Click **Run**
4. Verify in **Table Editor** that changes applied correctly
5. Update `supabase/schema.sql` to reflect current full schema

## Rollback Strategy

Since we share one database, destructive rollbacks are dangerous. Instead:

1. Write a **new forward migration** that reverses the change safely
2. Name it `NNN_revert_previous_change.sql`
3. Never use `DROP` on tables/columns that may have data — rename first, verify, then drop in a subsequent migration

## Schema Snapshot

After applying any migration, update `supabase/schema.sql` with the current full schema.
This file is the single source of truth for "what does the DB look like right now."
It is NOT run directly — it exists for documentation and reference only.
