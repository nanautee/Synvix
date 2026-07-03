import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "jsdom",
    include: ["src/__tests__/**/*.test.ts"],
  },
});
