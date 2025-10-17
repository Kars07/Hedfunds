import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import wasm from 'vite-plugin-wasm'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    wasm(),
    nodePolyfills(),
    react(),
  ],
  resolve: {
    alias: {
      buffer: 'buffer',
      crypto: 'crypto-browserify',
    },
  },
  server: {
    proxy: {
      '/bf': {
        rewrite: (path) => path.replace(/^\/bf/, ''),
        target: 'https://cardano-network.blockfrost.io/api/v0',
        changeOrigin: true,
        headers: {
          project_id: "preprodtJBS315srwdKRJldwtHxMqPJZplLRkCh",
        },
      },
    },
  },
  build: {
    target: 'es2022',
  },
});


