import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        game2d: resolve(__dirname, "2d.html"),
        prototype3d: resolve(__dirname, "prototypes/streetkid-3d/index.html"),
      },
    },
  },
});
