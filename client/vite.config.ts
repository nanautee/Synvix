import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: process.env.ELECTRON_BUILD ? "./" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@synvix/shared": path.resolve(__dirname, "../shared/types.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/ws": {
        target: "ws://localhost:3001",
        ws: true,
      },
      "/health": {
        target: "http://localhost:3001",
      },
    },
  },
});
