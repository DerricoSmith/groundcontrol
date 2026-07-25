import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/helpers/setup-env.ts"],
    // Tenant-isolation and service tests share one SQLite file and must not
    // interleave writes from parallel workers — see tests/helpers/test-db.ts.
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./tests/helpers/server-only-stub.ts"),
    },
  },
});
