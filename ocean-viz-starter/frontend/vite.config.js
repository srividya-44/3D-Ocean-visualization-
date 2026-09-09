import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

// vite-plugin-cesium automatically copies Cesium's static assets
// (workers, widgets, textures) so CesiumJS works without manual setup.
export default defineConfig({
  plugins: [react(), cesium()],
  server: {
    port: 5173,
  },
});
