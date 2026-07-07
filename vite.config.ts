import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // AI evaluation backend (server/index.mjs). If it isn't running,
      // requests fail fast and the game falls back to the local rubric.
      "/api": "http://localhost:8787",
    },
  },
});
