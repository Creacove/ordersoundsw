import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { getSolanaRpcEndpoint, isMainnetNetwork, publicEnv } from '@/config/publicEnv';

interface SolanaWalletProviderProps {
    children: ReactNode;
}

const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({ children }) => {
    const envNetwork = publicEnv.solanaNetwork;

    const network = useMemo(() => {
        const usesMainnet = isMainnetNetwork(envNetwork);
        const solanaNetwork = usesMainnet ? WalletAdapterNetwork.Mainnet : WalletAdapterNetwork.Devnet;
        console.log(`Using ${envNetwork} network for Solana operations`);
        return solanaNetwork;
    }, [envNetwork]);

    const endpoint = useMemo(() => {
        const rpcEndpoint = getSolanaRpcEndpoint(envNetwork);
        console.log(`Using ${envNetwork} RPC endpoint:`, rpcEndpoint);
        return rpcEndpoint;
    }, [envNetwork]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
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
                wsEndpoint: undefined,
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
