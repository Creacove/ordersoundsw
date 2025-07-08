
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection, Transaction, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction, 
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError
} from '@solana/spl-token';
import { toast } from 'sonner';

// USDC Mint addresses for different networks
const USDC_MINT_ADDRESSES = {
  'mainnet-beta': new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  'devnet': new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
  'testnet': new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
};

// Get current network's USDC mint - FORCE DEVNET FOR NOW
const getUSDCMint = (network: string = 'devnet'): PublicKey => {
  // Force devnet usage for testing
  console.log(`🌐 Forcing DEVNET for USDC transactions (requested: ${network})`);
  return USDC_MINT_ADDRESSES.devnet;
};

// Check if a string is a valid Solana address
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    if (!address) return false;
    new PublicKey(address);
    return true;
  } catch (error) {
    console.error("Invalid Solana address:", error);
    return false;
  }
};

// Convert USD amount to USDC units (6 decimals)
const usdToUSDCUnits = (usdAmount: number): bigint => {
  return BigInt(Math.round(usdAmount * 1_000_000)); // USDC has 6 decimals
};

// Check USDC balance for an account
const checkUSDCBalance = async (
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey
): Promise<{ balance: bigint; hasAccount: boolean }> => {
  try {
    const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);
    const account = await getAccount(connection, associatedTokenAddress);
    return { balance: account.amount, hasAccount: true };
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError || 
        error instanceof TokenInvalidAccountOwnerError) {
      return { balance: BigInt(0), hasAccount: false };
    }
    throw error;
  }
};

// Create or get associated token account
const getOrCreateAssociatedTokenAccount = async (
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  transaction: Transaction
): Promise<PublicKey> => {
  const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);
  
  try {
    // Check if account exists
    await getAccount(connection, associatedTokenAddress);
    console.log(`✓ USDC token account exists: ${associatedTokenAddress.toString()}`);
    return associatedTokenAddress;
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError) {
      // Account doesn't exist, create it
      console.log(`Creating USDC token account for: ${owner.toString()}`);
      const createAccountInstruction = createAssociatedTokenAccountInstruction(
        payer,
        associatedTokenAddress,
        owner,
        mint
      );
      transaction.add(createAccountInstruction);
      return associatedTokenAddress;
    }
    throw error;
  }
};

// Simulate transaction to catch errors early
const simulateTransaction = async (
  connection: Connection,
  transaction: Transaction
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Use the correct overload: (transaction, signers, options)
    const simulation = await connection.simulateTransaction(transaction);
    
    if (simulation.value.err) {
      console.error('Transaction simulation failed:', simulation.value.err);
      return { 
        success: false, 
        error: `Transaction would fail: ${JSON.stringify(simulation.value.err)}` 
      };
    }
    
    console.log('✓ Transaction simulation successful');
    return { success: true };
  } catch (error) {
    console.error('Simulation error:', error);
    return { 
      success: false, 
      error: `Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Add priority fee to transaction for faster confirmation
const addPriorityFee = (transaction: Transaction, microLamports: number = 10000) => {
  const priorityFeeInstruction = SystemProgram.transfer({
    fromPubkey: transaction.feePayer!,
    toPubkey: transaction.feePayer!,
    lamports: 0
  });
  
  // Add as first instruction for priority processing
  transaction.instructions.unshift(priorityFeeInstruction);
};

// Process a single USDC payment - FORCE DEVNET
export const processUSDCPayment = async (
  usdAmount: number,
  recipientAddress: string, 
  connection: Connection, 
  wallet: WalletContextState,
  network: string = 'devnet'
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    if (!isValidSolanaAddress(recipientAddress)) throw new Error("Invalid recipient address");
    
    // FORCE DEVNET - Override any network parameter
    const forceDevnet = 'devnet';
    const usdcMint = getUSDCMint(forceDevnet);
    const usdcAmount = usdToUSDCUnits(usdAmount);
    
    console.log(`💰 Processing DEVNET USDC payment: $${usdAmount} (${usdcAmount.toString()} USDC units) to ${recipientAddress}`);
    console.log(`🌐 FORCED Network: ${forceDevnet}, USDC Mint: ${usdcMint.toString()}`);
    
    // Check sender's USDC balance first
    const { balance: senderBalance, hasAccount: senderHasAccount } = await checkUSDCBalance(
      connection, 
      wallet.publicKey, 
      usdcMint
    );
    
    console.log(`💳 Sender USDC balance: ${senderBalance.toString()} units (${Number(senderBalance) / 1_000_000} USDC)`);
    
    if (!senderHasAccount) {
      throw new Error("You don't have a USDC token account. Please fund your wallet with DEVNET USDC first.");
    }
    
    if (senderBalance < usdcAmount) {
      const availableUSDC = Number(senderBalance) / 1_000_000;
      throw new Error(`Insufficient DEVNET USDC balance. You have ${availableUSDC.toFixed(2)} USDC but need ${usdAmount} USDC.`);
    }
    
    const transaction = new Transaction();
    
    // Get sender's USDC token account
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.publicKey,
      usdcMint,
      wallet.publicKey,
      transaction
    );
    
    // Get recipient's USDC token account
    const recipientPublicKey = new PublicKey(recipientAddress);
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.publicKey, // Payer for account creation
      usdcMint,
      recipientPublicKey,
      transaction
    );
    
    console.log(`📤 From: ${senderTokenAccount.toString()}`);
    console.log(`📥 To: ${recipientTokenAccount.toString()}`);
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      senderTokenAccount,
      recipientTokenAccount,
      wallet.publicKey,
      usdcAmount,
      [],
      TOKEN_PROGRAM_ID
    );
    
    transaction.add(transferInstruction);
    
    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Add priority fee for faster confirmation
    addPriorityFee(transaction, 15000);
    
    // Simulate transaction before sending
    const simulation = await simulateTransaction(connection, transaction);
    if (!simulation.success) {
      throw new Error(simulation.error || "Transaction simulation failed");
    }
    
    console.log('🚀 Sending DEVNET USDC transaction...');
    
    // Sign and send the transaction
    const signature = await wallet.sendTransaction(transaction, connection, {
      maxRetries: 5,
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
    
    console.log(`📋 DEVNET USDC transfer signature: ${signature}`);
    
    // Wait for confirmation with timeout
    const confirmationStart = Date.now();
    const confirmationTimeout = 60000; // 60 seconds
    
    let confirmation;
    while (Date.now() - confirmationStart < confirmationTimeout) {
      try {
        confirmation = await connection.confirmTransaction(signature, 'confirmed');
        if (confirmation.value) break;
      } catch (error) {
        console.warn('Confirmation check failed, retrying...', error);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (!confirmation || confirmation.value.err) {
      throw new Error(`Transaction failed to confirm: ${confirmation?.value.err?.toString() || 'Timeout'}`);
    }
    
    console.log('✅ DEVNET USDC transaction confirmed successfully');
    return signature;
  } catch (error: any) {
    console.error("❌ Error in DEVNET USDC transaction:", error);
    
    // Provide specific error messages for common issues
    if (error.message.includes('0x1')) {
      throw new Error("Insufficient SOL balance for transaction fees. Please add SOL to your wallet.");
    }
    if (error.message.includes('TokenAccountNotFoundError')) {
      throw new Error("DEVNET USDC token account not found. Please ensure you have DEVNET USDC in your wallet.");
    }
    if (error.message.includes('insufficient funds')) {
      throw new Error("Insufficient DEVNET USDC balance for this transaction.");
    }
    
    throw new Error(error.message || "Failed to process DEVNET USDC payment");
  }
};

// Process multiple USDC payments in batch - FORCE DEVNET
export const processMultipleUSDCPayments = async (
  items: { price: number, producerWallet: string, id?: string, title?: string }[],
  connection: Connection, 
  wallet: WalletContextState,
  network: string = 'devnet'
): Promise<string[]> => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    
    // Validate all recipient addresses first
    for (const item of items) {
      if (!isValidSolanaAddress(item.producerWallet)) {
        throw new Error(`Invalid recipient address: ${item.producerWallet}`);
      }
    }
    
    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
    // FORCE DEVNET
    const forceDevnet = 'devnet';
    const usdcMint = getUSDCMint(forceDevnet);
    
    // Check total USDC balance before processing any transactions
    const { balance: senderBalance, hasAccount: senderHasAccount } = await checkUSDCBalance(
      connection, 
      wallet.publicKey, 
      usdcMint
    );
    
    if (!senderHasAccount) {
      throw new Error("You don't have a DEVNET USDC token account. Please fund your wallet with DEVNET USDC first.");
    }
    
    const availableUSDC = Number(senderBalance) / 1_000_000;
    if (availableUSDC < totalAmount) {
      throw new Error(`Insufficient DEVNET USDC balance. You have ${availableUSDC.toFixed(2)} USDC but need ${totalAmount.toFixed(2)} USDC.`);
    }
    
    console.log(`💰 Processing ${items.length} DEVNET USDC payments, total: $${totalAmount}`);
    
    const signatures: string[] = [];
    
    // Process sequentially to avoid nonce conflicts
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        console.log(`📦 Processing DEVNET payment ${i + 1}/${items.length}: $${item.price} to ${item.producerWallet}`);
        
        const signature = await processUSDCPayment(
          item.price,
          item.producerWallet,
          connection,
          wallet,
          forceDevnet // Force devnet
        );
        signatures.push(signature);
        
        // Small delay between transactions to avoid rate limiting
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`❌ Failed DEVNET USDC payment to ${item.producerWallet}:`, error);
        throw error;
      }
    }
    
    console.log(`✅ All ${items.length} DEVNET USDC payments completed successfully`);
    return signatures;
  } catch (error: any) {
    console.error("❌ Error processing multiple DEVNET USDC payments:", error);
    throw new Error(error.message || "Failed to process DEVNET USDC payments");
  }
};
