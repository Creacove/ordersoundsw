
import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    CoinbaseWalletAdapter,
    CloverWalletAdapter,
    SalmonWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter,
    MathWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

interface SolanaWalletProviderProps {
    children: ReactNode;
}

const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({ children }) => {
    // Dynamic network selection from environment
    const network = useMemo(() => {
        const envNetwork = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
        const solanaNetwork = envNetwork === 'mainnet' ? WalletAdapterNetwork.Mainnet : WalletAdapterNetwork.Devnet;
        console.log(`🌐 Using ${envNetwork} network for Solana operations`);
        return solanaNetwork;
    }, []);

    // Dynamic RPC endpoint selection
    const endpoint = useMemo(() => {
        const envNetwork = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
        const rpcEndpoint = envNetwork === 'mainnet' 
            ? (import.meta.env.VITE_MAINNET_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com')
            : (import.meta.env.VITE_DEVNET_RPC_ENDPOINT || 'https://greatest-proportionate-hill.solana-devnet.quiknode.pro/41e5bfe38a70eea3949938349ff08bed95d6290b/');
        console.log(`🔗 Using ${envNetwork} RPC endpoint:`, rpcEndpoint);
        return rpcEndpoint;
    }, []);

    // Configure wallet adapters dynamically based on network
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new CoinbaseWalletAdapter(),
            new CloverWalletAdapter(),
            new SalmonWalletAdapter(),
            new TorusWalletAdapter(),
            new LedgerWalletAdapter(),
            new MathWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider 
            endpoint={endpoint}
            config={{
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 60000,
                httpHeaders: {
                    'Content-Type': 'application/json',
                },
                wsEndpoint: undefined, // Use HTTP only for QuickNode
            }}
        >
            <WalletProvider 
                wallets={wallets} 
                autoConnect={true}
                onError={(error) => {
                    console.error('Wallet error:', error);
                }}
            >
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default SolanaWalletProvider;
