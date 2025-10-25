
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Add historyApiFallback to handle client-side routing
    historyApiFallback: true,
  },
  plugins: [
    react(),
    // Add node polyfills plugin
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util', 'events'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Force CommonJS module resolution for WalletConnect packages in dev mode
    conditions: mode === 'development' ? ['module', 'import', 'require'] : undefined,
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Optimize rollup options for large dependencies
    rollupOptions: {
      output: {
        // Manual chunk splitting to reduce bundle size
        manualChunks: {
          // Separate Solana wallet dependencies
          'solana-wallet': [
            '@solana/wallet-adapter-base',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/wallet-adapter-wallets',
            '@solana/web3.js',
            '@solana/spl-token'
          ],
          // Separate other vendor libraries
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          // Separate UI components (fix the @radix-ui/react-button issue)
          'ui': [
            'lucide-react'
          ]
        }
      },
      // Increase memory limit and optimize for large bundles
      maxParallelFileOps: 2,
    },
    // Increase memory for the build process
    target: 'esnext',
    minify: mode === 'production' ? 'esbuild' : false,
    // Handle mixed ESM/CJS modules
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@solana/wallet-adapter-react',
      '@solana/web3.js'
    ],
    exclude: [
      // Exclude all WalletConnect packages to prevent module resolution issues
      '@walletconnect/utils',
      '@walletconnect/time',
      '@walletconnect/relay-auth',
      '@walletconnect/core',
      '@walletconnect/sign-client',
      '@walletconnect/universal-provider',
      '@walletconnect/heartbeat',
      '@reown/appkit',
      '@reown/appkit-controllers',
      // Exclude other problematic crypto libraries
      'viem',
      'ox'
    ],
    // Force eager optimization with relaxed module handling
    esbuildOptions: {
      target: 'esnext',
      supported: { bigint: true },
    }
  },
  // Handle SSR/dev mode externals for WalletConnect
  ssr: {
    external: mode === 'development' ? [
      '@walletconnect/heartbeat',
      '@walletconnect/time',
    ] : undefined,
  },
  // Define global constants to help with tree shaking and compatibility
  define: {
    global: 'globalThis',
    'process.env': '{}',
  },
}));
