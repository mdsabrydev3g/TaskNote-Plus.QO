-- TaskNote Plus — Row-Level Security (defense-in-depth behind app-layer workspace scoping, §10.4)
-- Apply AFTER creating tables (prisma migrate / db push):
--   psql "$DATABASE_URL" -f prisma/sql/rls.sql
--
-- The app must open a transaction and run:
--   SELECT set_config('app.workspace_id', $1, true)
-- before any query (see src/lib/db.ts -> scoped()).
--
-- NOTE: Neon's default role (neon_superuser) has BYPASSRLS. Policies bind to
-- the `public` role; create/grant an unprivileged `tnp_app` role for full effect:
--   CREATE ROLE tnp_app LOGIN PASSWORD '...'; GRANT USAGE ON SCHEMA public TO tnp_app;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tnp_app;
-- Then point the app's DATABASE_URL at tnp_app (migrations still run as owner).

-- ════════════════════════════════════════════════════════════
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Note', 'Task', 'Project', 'Event', 'Tag', 'NoteTag', 'TaskTag',
    'Link', 'AIActionLog', 'Device'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($f$
      DROP POLICY IF EXISTS workspace_isolation ON public.%1$I;
      CREATE POLICY workspace_isolation ON public.%1$I
        USING (
          "workspaceId" = current_setting('app.workspace_id', true)::uuid
        )
        WITH CHECK (
          "workspaceId" = current_setting('app.workspace_id', true)::uuid
        )
    $f$, t);
  END LOOP;
END $$;

-- NoteTag / TaskTag join tables have no workspaceId column: isolate via parent.
DROP POLICY IF EXISTS workspace_isolation ON public."NoteTag";
CREATE POLICY workspace_isolation ON public."NoteTag"
  USING (EXISTS (SELECT 1 FROM public."Note" n WHERE n.id = "NoteTag"."noteId"
                 AND n."workspaceId" = current_setting('app.workspace_id', true)::uuid))
  WITH CHECK (EXISTS (SELECT 1 FROM public."Note" n WHERE n.id = "NoteTag"."noteId"
                 AND n."workspaceId" = current_setting('app.workspace_id', true)::uuid));

DROP POLICY IF EXISTS workspace_isolation ON public."TaskTag";
CREATE POLICY workspace_isolation ON public."TaskTag"
  USING (EXISTS (SELECT 1 FROM public."Task" k WHERE k.id = "TaskTag"."taskId"
                 AND k."workspaceId" = current_setting('app.workspace_id', true)::uuid))
  WITH CHECK (EXISTS (SELECT 1 FROM public."Task" k WHERE k.id = "TaskTag"."taskId"
                 AND k."workspaceId" = current_setting('app.workspace_id', true)::uuid));

-- Full-text search helper (Postgres FTS, §7.10): simple expression index on notes/tasks
CREATE INDEX IF NOT EXISTS note_fts_gin ON public."Note" USING gin (
  to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("content", ''))
);
CREATE INDEX IF NOT EXISTS task_fts_gin ON public."Task" USING gin (
  to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("description", ''))
);
