
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { toast } from 'sonner';

// Smart contract program ID (DEVNET)
const PAYMENT_SPLITTER_PROGRAM_ID = new PublicKey('8QJVBNGGbkR1xKYZZMqWvbPMDLZcGWfyN7KxYx1h8F3v');

// USDC mint address on DEVNET
const USDC_MINT_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// Platform wallet from environment (fallback for development)
const PLATFORM_WALLET = new PublicKey(
  import.meta.env.VITE_PLATFORM_WALLET || 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH'
);

// IDL type definition for the smart contract
export interface PaymentSplitterIDL {
  version: string;
  name: string;
  instructions: Array<{
    name: string;
    accounts: Array<{
      name: string;
      isMut: boolean;
      isSigner: boolean;
    }>;
    args: Array<{
      name: string;
      type: string;
    }>;
  }>;
  accounts: Array<{
    name: string;
    type: {
      kind: string;
      fields: Array<{
        name: string;
        type: string;
      }>;
    };
  }>;
  events: Array<{
    name: string;
    fields: Array<{
      name: string;
      type: string;
      index: boolean;
    }>;
  }>;
  errors: Array<{
    code: number;
    name: string;
    msg: string;
  }>;
}

// Generate platform config PDA
export const getPlatformConfigPDA = (): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('platform_config')],
    PAYMENT_SPLITTER_PROGRAM_ID
  );
};

// Check if platform is initialized
export const isPlatformInitialized = async (connection: Connection): Promise<boolean> => {
  try {
    const [platformConfigPDA] = getPlatformConfigPDA();
    const accountInfo = await connection.getAccountInfo(platformConfigPDA);
    return accountInfo !== null;
  } catch (error) {
    console.error('Error checking platform initialization:', error);
    return false;
  }
};

// Process split payment using smart contract
export const processSmartContractPayment = async (
  amount: number,
  producerWallet: string,
  connection: Connection,
  wallet: WalletContextState,
  network: string = 'devnet'
): Promise<string> => {
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    console.log(`🔥 Processing smart contract payment: $${amount} to ${producerWallet}`);

    // Convert USD to USDC units (6 decimals)
    const usdcAmount = new BN(Math.round(amount * 1_000_000));
    
    // Create provider
    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    });

    // Get PDAs and token accounts
    const [platformConfigPDA] = getPlatformConfigPDA();
    const producerPublicKey = new PublicKey(producerWallet);
    
    const payerTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT_DEVNET,
      wallet.publicKey
    );
    
    const producerTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT_DEVNET,
      producerPublicKey
    );
    
    const platformTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT_DEVNET,
      PLATFORM_WALLET
    );

    // Build transaction instruction
    const instruction = new web3.TransactionInstruction({
      keys: [
        { pubkey: platformConfigPDA, isSigner: false, isWritable: false },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: producerPublicKey, isSigner: false, isWritable: false },
        { pubkey: payerTokenAccount, isSigner: false, isWritable: true },
        { pubkey: producerTokenAccount, isSigner: false, isWritable: true },
        { pubkey: platformTokenAccount, isSigner: false, isWritable: true },
        { pubkey: USDC_MINT_DEVNET, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: PAYMENT_SPLITTER_PROGRAM_ID,
      data: Buffer.concat([
        Buffer.from([0x1]), // process_split_payment discriminator
        usdcAmount.toBuffer('le', 8), // amount as u64
      ]),
    });

    // Create and send transaction
    const transaction = new Transaction().add(instruction);
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    console.log('🚀 Sending smart contract transaction...');
    
    const signature = await wallet.sendTransaction(transaction, connection, {
      maxRetries: 5,
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Smart contract transaction failed: ${confirmation.value.err.toString()}`);
    }

    console.log(`✅ Smart contract payment successful: ${signature}`);
    return signature;

  } catch (error: any) {
    console.error('❌ Smart contract payment error:', error);
    
    // Provide specific error messages
    if (error.message.includes('0x1')) {
      throw new Error('Insufficient SOL balance for transaction fees');
    }
    if (error.message.includes('InsufficientBalance')) {
      throw new Error('Insufficient USDC balance for this payment');
    }
    if (error.message.includes('InvalidAmount')) {
      throw new Error('Invalid payment amount');
    }
    
    throw new Error(error.message || 'Smart contract payment failed');
  }
};

// Process multiple payments using smart contract
export const processMultipleSmartContractPayments = async (
  items: { price: number; producerWallet: string; id?: string; title?: string }[],
  connection: Connection,
  wallet: WalletContextState,
  network: string = 'devnet'
): Promise<string[]> => {
  try {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    console.log(`🔥 Processing ${items.length} smart contract payments`);
    
    const signatures: string[] = [];
    
    // Process each payment sequentially to avoid nonce conflicts
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        console.log(`📦 Processing smart contract payment ${i + 1}/${items.length}: $${item.price} to ${item.producerWallet}`);
        
        const signature = await processSmartContractPayment(
          item.price,
          item.producerWallet,
          connection,
          wallet,
          network
        );
        
        signatures.push(signature);
        
        // Small delay between transactions
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error: any) {
        console.error(`❌ Failed smart contract payment to ${item.producerWallet}:`, error);
        throw error;
      }
    }
    
    console.log(`✅ All ${items.length} smart contract payments completed successfully`);
    return signatures;
    
  } catch (error: any) {
    console.error('❌ Error processing multiple smart contract payments:', error);
    throw new Error(error.message || 'Failed to process smart contract payments');
  }
};
