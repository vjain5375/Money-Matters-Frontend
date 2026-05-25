import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// Optional Brotli/GZip compression for built assets
// Activate by running: npm install --save-dev vite-plugin-compression2
let compressionPlugins = []
try {
  const { compression } = require('vite-plugin-compression2')
  compressionPlugins = [
    compression({ algorithm: 'gzip', exclude: [/\.(png|jpg|webp|gif|svg)$/] }),
    compression({ algorithm: 'brotliCompress', exclude: [/\.(png|jpg|webp|gif|svg)$/] }),
  ]
} catch {
  // Not installed — skip silently. Install for even smaller prod assets.
}

export default defineConfig({
  plugins: [react(), ...compressionPlugins],

  server: {
    port: 3000,
    open: true,
    strictPort: false,
    // Dev proxy — routes /api/* to local backend without CORS issues
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  // ── Production build settings ────────────────────────────────────────────
  build: {
    // esbuild minifier — built into Vite, zero extra deps
    minify: 'esbuild',

    // Inline small assets (<4KB) as base64 — eliminates extra HTTP round trips
    assetsInlineLimit: 4096,

    // Suppress legitimate large-chunk warnings (recharts + d3 is inherently big)
    chunkSizeWarningLimit: 800,

    // No sourcemaps in prod — smaller bundle, faster downloads
    sourcemap: false,

    // Modern browsers only — avoids legacy polyfill overhead
    target: ['es2020', 'chrome89', 'firefox89', 'safari14'],

    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting — vendor libs cache independently from app code.
         * When you update your app, users only re-download the app chunk, not React.
         *
         *   vendor-react  → React + ReactDOM (rarely changes)
         *   vendor-charts → Recharts + D3 (only on stock analysis page)
         *   vendor-motion → Framer Motion (loaded separately)
         *   vendor        → All other node_modules
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('/d3/'))
            return 'vendor-charts'
          if (id.includes('framer-motion'))
            return 'vendor-motion'
          if (id.includes('react-dom') || id.includes('react/jsx') || id.includes('scheduler'))
            return 'vendor-react'
          return 'vendor'
        },
        // Content-hashed filenames → safe for aggressive CDN/browser long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },

  // ── esbuild transform options (applies to both dev and prod) ─────────────
  esbuild: {
    // Strip all console.log + debugger statements from production code
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },

  // Pre-bundle heavy deps at dev-server start — eliminates cold-start lag
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'recharts', 'lucide-react'],
  },
})
