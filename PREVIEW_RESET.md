# Preview reset

Preview is disposable. Production is not.

## Full reset

```bash
node scripts/reset-preview.mjs --confirm
node scripts/with-db.mjs PREVIEW_DATABASE_URL npx prisma migrate deploy
node scripts/with-db.mjs PREVIEW_DATABASE_URL node scripts/seed-demo-org.mjs
```

Drops and recreates the `gc_preview` schema, reapplies migrations, and reseeds the demo.

## Safety

`scripts/reset-preview.mjs` refuses to run unless the connection string carries `schema=gc_preview`, and the DROP is scoped to that schema by name. There is no code path in it that can reach the production `public` schema. Without `--confirm` it prints what it would do and exits.

## When to reset

- A migration was applied to preview and then changed before reaching production.
- Preview data drifted enough to make a test misleading.
- Verifying that a cold, empty database seeds correctly, which is exactly how the v1.0.1 seed bug was found.
