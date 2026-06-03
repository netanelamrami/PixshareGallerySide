import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path, { extname, relative, resolve } from "path";
import { componentTagger } from "lovable-tagger";
import basicSsl from '@vitejs/plugin-basic-ssl';
import { globSync } from "fs";
import { fileURLToPath } from "url";


const secureEntries = globSync("src/non_secure/**/*.{js,jsx,ts,tsx}").reduce(
  (acc: any, file) => {
    // Generates names like 'secure/Settings' from 'src/secure/Settings.tsx'
    const name = relative("src", file).replace(extname(file), "");
    acc[name] = fileURLToPath(new URL(file, import.meta.url));
    return acc;
  },
  {},
);


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: 'public',
  server: {
    host: "127.0.0.1",
    port: 8080,
    proxy: {
      '/api': {
        target: 'https://localhost:7120', // Your ASP.NET API
        changeOrigin: true,
        secure: false, // Don't fail on self-signed certs
      }
    }
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        ...secureEntries,
      },
      output: {
        compact: true,
        asciiOnly: true,

        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "main") return "[name].js";
          const fromNsc = chunkInfo.moduleIds.some((id) =>
            id.includes("/non_secure/"),
          );
          return fromNsc ? "nsc/[hash].js" : "[hash].js";
        },
        chunkFileNames: (info) => {
          if (!info) return "[hash].js";
          const fromNsc = info.moduleIds.some((id) =>
            id.includes("/non_secure/"),
          );
          return fromNsc ? "nsc/[hash].js" : "[hash].js";
        },
        assetFileNames: ({ name }) => {
          const ext = name?.match(/\.(\w+)$/)?.[1] ?? "";
          const pathStr = String(name || "");
          return pathStr.includes("/non_secure/")
            ? `nsc/[hash].${ext}`
            : `[hash].${ext}`;
        },

        manualChunks(id) {
          if (id.includes("node_modules")) return "vendor";
          if (id.includes("/non_secure/") && !/\.(t|j)sx?$/.test(id))
            return "non_secure-shared";
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    basicSsl()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
