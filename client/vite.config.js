import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";

/**
 * SPA fallback for static hosting (Render, etc.):
 * After the production build, copy the generated dist/index.html to
 * dist/404.html. Render static sites serve a custom /404.html for any
 * path that does not match an existing file, so reloading deep client-side
 * routes like /students or /fees boots the React app instead of showing
 * Render's "Not Found" page. React Router then renders the correct page
 * from the URL.
 *
 * NOTE: This must copy the BUILT index.html (with hashed asset URLs),
 * not the source index.html — which is why it runs as a post-build step.
 */
const spa404Fallback = () => ({
  name: "spa-404-fallback",
  apply: "build",
  closeBundle() {
    const outDir = fileURLToPath(new URL("./dist", import.meta.url));
    const indexPath = `${outDir}/index.html`;
    if (existsSync(indexPath)) {
      copyFileSync(indexPath, `${outDir}/404.html`);
      console.log("✔ Generated dist/404.html (SPA fallback for static hosts)");
    }
  },
});

export default defineConfig({
  base: "/",
  plugins: [react(), spa404Fallback()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          pdf: ["html2canvas", "jspdf"],
          icons: ["lucide-react"]
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

