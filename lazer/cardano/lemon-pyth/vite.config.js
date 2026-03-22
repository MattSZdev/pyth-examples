import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path' 

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      // Habilitamos los polyfills globales para Buffer y Process
      globals: { 
        Buffer: true, 
        global: true, 
        process: true 
      },
      protocolImports: true,
    }),
  ],
  // Crucial: Asegura que 'global' sea entendido por las librerías Web3
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // --- SOLUCIÓN AL ERROR DE STREAM-BROWSERIFY ---
      'stream': 'stream-browserify',
      'node:stream/web': 'stream-browserify',
      'node:stream': 'stream-browserify',
    },
  },
  base: '/',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: true,
    proxy: {
      '/api/binance': {
        target: 'https://fapi.binance.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/binance/, '/fapi/v1/klines')
      }
    }
  },
  // Optimización de dependencias para evitar errores de carga en frío
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      supported: { 
        bigint: true 
      },
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext', 
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})