import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"

const apiProxyTarget = process.env.VITE_PROXY_TARGET || "http://api:8000"
const vendorChunkDeps = [
  "react",
  "react-dom",
  "react-router-dom",
  "@tanstack/react-query",
  "@tanstack/react-virtual",
  "lucide-react",
  "date-fns"
]
const tiptapChunkDeps = [
  "@tiptap/react",
  "@tiptap/starter-kit",
  "@tiptap/extension-link",
  "@tiptap/extension-underline"
]

const matchesChunk = (id: string, packages: string[]) =>
  packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))

export default defineConfig({
  plugins: [react({ plugins: [], disableOxcRecommendation: true })],
  envDir: "..",
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/visual/**", "node_modules/**"],
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts"
  },
  server: {
    port: 5173,
    proxy: {
      "^/(auth|calendar|compose|docs|emails|health|labels|openapi\\.json|ready|search|sync|webhooks)": {
        target: apiProxyTarget,
        changeOrigin: true
      },
      "/ws": {
        target: apiProxyTarget,
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (matchesChunk(id, vendorChunkDeps)) return "vendor"
          if (matchesChunk(id, tiptapChunkDeps)) return "tiptap"
        }
      }
    }
  }
})
