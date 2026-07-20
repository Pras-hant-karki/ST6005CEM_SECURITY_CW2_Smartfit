import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiTarget = env.VITE_PROXY_API_TARGET || "http://192.168.1.67:8000"

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          // Lets this proxy reach the backend when it's running with the
          // self-signed dev cert (Backend HTTPS_ENABLED=true) without Node
          // rejecting the untrusted certificate.
          secure: false,
          configure: (proxy) => {
            // The browser only ever talks to this Vite dev server over plain
            // HTTP, even when the upstream backend is HTTPS and marks its
            // cookies Secure. A Secure-flagged cookie can't be set over an
            // HTTP connection, so strip the flag on the hop back to the
            // browser. Dev-only — never runs in the production build.
            proxy.on("proxyRes", (proxyRes) => {
              const setCookie = proxyRes.headers["set-cookie"];
              if (setCookie) {
                proxyRes.headers["set-cookie"] = setCookie.map((cookie) =>
                  cookie.replace(/;\s*Secure/gi, "")
                );
              }
            });
          },
        },
      },
    },
  }
})
