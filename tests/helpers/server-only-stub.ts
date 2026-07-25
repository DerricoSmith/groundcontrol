// vitest.config.ts aliases the bare "server-only" specifier to this file.
// The real "server-only" npm package unconditionally throws on import —
// it relies on Next.js's bundler swapping it for a no-op module in actual
// server bundles. Vitest has no such bundler-level aliasing, so without
// this stub every service module that does `import "server-only"` would
// fail to even load under the test runner. This file intentionally does
// nothing; it exists only to make the import side-effect-free in tests.
export {};
