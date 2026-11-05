import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Automatic JSX runtime (React 17+), so no React plugin is needed for tests.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
  },
});
