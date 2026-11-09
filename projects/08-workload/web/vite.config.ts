import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const sharedUi = resolve(here, "../../../shared/ui");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@sd/ui": sharedUi },
  },
  server: {
    port: 5181,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8008",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ""),
      },
    },
  },
});
