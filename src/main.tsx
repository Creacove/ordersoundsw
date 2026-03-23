
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import SolanaWalletProvider from './components/wallet/SolanaWalletProvider.tsx'
import { publicEnv } from './config/publicEnv.ts'

// BETA version notice
console.log('%c OrderSOUNDS BETA', 'background: #8855FF; color: white; padding: 5px; border-radius: 3px; font-weight: bold;');
console.log('This is a beta version. Please report any issues you encounter.');

// Log environment loading (can be removed in production)
if (publicEnv.isDev) {
  console.log('Environment variables loaded:', {
    hasPaystackKey: !!publicEnv.paystackPublicKey,
    hasSupabaseKey: !!publicEnv.supabasePublishableKey,
    hasSupabaseUrl: !!publicEnv.supabaseUrl,
  });
}

// No need for manual polyfills anymore as they're handled by vite-plugin-node-polyfills

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

const root = createRoot(rootElement);
root.render(
  <BrowserRouter>
    <SolanaWalletProvider>
      <App />
    </SolanaWalletProvider>
  </BrowserRouter>
);
