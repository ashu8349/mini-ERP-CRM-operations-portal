import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    globalSetup: "./tests/setup/global-setup.ts",
    setupFiles: ["./tests/setup/test-env.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});