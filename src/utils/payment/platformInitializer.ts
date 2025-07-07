
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { getPlatformConfigPDA, isPlatformInitialized } from './smartContractPayments';

const PAYMENT_SPLITTER_PROGRAM_ID = new PublicKey('8QJVBNGGbkR1xKYZZMqWvbPMDLZcGWfyN7KxYx1h8F3v');
const PLATFORM_WALLET = new PublicKey(
  import.meta.env.VITE_PLATFORM_WALLET || 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH'
);

export const initializePlatform = async (
  connection: Connection,
  wallet: WalletContextState
): Promise<string> => {
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    // Check if already initialized
    const alreadyInitialized = await isPlatformInitialized(connection);
    if (alreadyInitialized) {
      throw new Error('Platform already initialized');
    }

    console.log('🚀 Initializing payment splitter platform...');

    const [platformConfigPDA] = getPlatformConfigPDA();

    // Build initialization instruction
    const instruction = {
      keys: [
        { pubkey: platformConfigPDA, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PAYMENT_SPLITTER_PROGRAM_ID,
      data: Buffer.concat([
        Buffer.from([0x0]), // initialize_platform discriminator
        PLATFORM_WALLET.toBuffer(), // platform_wallet
      ]),
    };

    const transaction = new Transaction().add(instruction);
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    const signature = await wallet.sendTransaction(transaction, connection, {
      maxRetries: 5,
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Platform initialization failed: ${confirmation.value.err.toString()}`);
    }

    console.log(`✅ Platform initialized successfully: ${signature}`);
    return signature;

  } catch (error: any) {
    console.error('❌ Platform initialization error:', error);
    throw new Error(error.message || 'Failed to initialize platform');
  }
};

export const checkAndInitializePlatform = async (
  connection: Connection,
  wallet: WalletContextState
): Promise<boolean> => {
  try {
    const initialized = await isPlatformInitialized(connection);
    
    if (!initialized) {
      console.log('Platform not initialized, attempting to initialize...');
      await initializePlatform(connection, wallet);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize platform:', error);
    return false;
  }
};
