import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const apiProxyTarget = process.env.VITE_PROXY_TARGET || "http://api:8000"

export default defineConfig({
  plugins: [react()],
  envDir: "..",
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
  }
})
