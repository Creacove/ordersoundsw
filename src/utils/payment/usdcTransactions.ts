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
// Smart contract imports removed for direct transfer with platform fee

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

// Check if Associated Token Account exists on-chain
const checkATAExists = async (
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<{ exists: boolean; address: PublicKey }> => {
  const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);
  
  try {
    await getAccount(connection, associatedTokenAddress);
    return { exists: true, address: associatedTokenAddress };
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError) {
      return { exists: false, address: associatedTokenAddress };
    }
    throw error;
  }
};

// Create missing Associated Token Accounts in a separate transaction
const createMissingATAs = async (
  connection: Connection,
  wallet: WalletContextState,
  mint: PublicKey,
  owners: PublicKey[]
): Promise<string | null> => {
  if (!wallet.publicKey) throw new Error("Wallet not connected");
  
  const missingATAs: { owner: PublicKey; ata: PublicKey }[] = [];
  
  // Check which ATAs are missing
  for (const owner of owners) {
    const { exists, address } = await checkATAExists(connection, mint, owner);
    if (!exists) {
      missingATAs.push({ owner, ata: address });
      console.log(`🔍 Missing ATA for ${owner.toString()}: ${address.toString()}`);
    } else {
      console.log(`✅ ATA exists for ${owner.toString()}: ${address.toString()}`);
    }
  }
  
  if (missingATAs.length === 0) {
    console.log('✨ All ATAs already exist, no creation needed');
    return null;
  }
  
  console.log(`🏗️  Creating ${missingATAs.length} missing ATAs...`);
  
  // Create transaction for ATA creation
  const transaction = new Transaction();
  
  for (const { owner, ata } of missingATAs) {
    const createInstruction = createAssociatedTokenAccountInstruction(
      wallet.publicKey, // payer
      ata,              // ata address
      owner,            // owner
      mint              // mint
    );
    transaction.add(createInstruction);
  }
  
  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;
  
  console.log('🚀 Sending ATA creation transaction...');
  
  // Send ATA creation transaction
  const signature = await wallet.sendTransaction(transaction, connection, {
    maxRetries: 5,
    skipPreflight: false,
    preflightCommitment: 'confirmed'
  });
  
  // Wait for confirmation
  const confirmation = await connection.confirmTransaction(signature, 'confirmed');
  if (confirmation.value.err) {
    throw new Error(`ATA creation failed: ${confirmation.value.err.toString()}`);
  }
  
  console.log(`✅ Created ${missingATAs.length} ATAs successfully: ${signature}`);
  return signature;
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
  // Remove the invalid priority fee instruction that was causing AccountNotFound error
  // Priority fees should be handled by the RPC endpoint configuration instead
};

// Platform wallet for receiving 20% fee (from environment variable)
const PLATFORM_WALLET = new PublicKey(
  import.meta.env.VITE_PLATFORM_WALLET || '2knSANp9pvHTmJL3HATQNY5CeQxtT9iRHmRPY5Fse9aC'
);

// Process USDC payment with 80/20 split
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
    console.log(`💰 Processing DEVNET USDC payment with 80/20 split: $${usdAmount} to ${recipientAddress}`);
    
    // Calculate splits: 80% to producer, 20% to platform
    const producerAmount = usdAmount * 0.8;
    const platformAmount = usdAmount * 0.2;
    
    console.log(`🎯 Producer gets: $${producerAmount.toFixed(2)} (80%)`);
    console.log(`🏢 Platform gets: $${platformAmount.toFixed(2)} (20%)`);
    
    // Process producer payment first
    const producerSignature = await processSingleDirectTransfer(
      producerAmount,
      recipientAddress,
      connection,
      wallet,
      forceDevnet,
      'producer'
    );
    
    // Process platform fee payment
    const platformSignature = await processSingleDirectTransfer(
      platformAmount,
      PLATFORM_WALLET.toString(),
      connection,
      wallet,
      forceDevnet,
      'platform'
    );
    
    console.log(`✅ Split payment completed - Producer: ${producerSignature}, Platform: ${platformSignature}`);
    return producerSignature; // Return producer signature as primary
  } catch (error: any) {
    console.error("❌ Error in split USDC payment:", error);
    throw new Error(error.message || "Failed to process split payment");
  }
};

// Single direct transfer helper function
const processSingleDirectTransfer = async (
  usdAmount: number,
  recipientAddress: string,
  connection: Connection,
  wallet: WalletContextState,
  network: string,
  recipient: 'producer' | 'platform'
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    
    const usdcMint = getUSDCMint(network);
    const usdcAmount = usdToUSDCUnits(usdAmount);
    
    console.log(`🌐 FORCED Network: ${network}, USDC Mint: ${usdcMint.toString()}`);
    
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
    
    // STEP 1: Create missing ATAs first
    const recipientPublicKey = new PublicKey(recipientAddress);
    const owners = [wallet.publicKey, recipientPublicKey];
    
    console.log(`🔍 Checking ATAs for sender: ${wallet.publicKey.toString()} and ${recipient}: ${recipientPublicKey.toString()}`);
    
    const ataCreationSignature = await createMissingATAs(connection, wallet, usdcMint, owners);
    if (ataCreationSignature) {
      console.log(`⏳ Waiting for ATA creation to settle...`);
      // Wait for confirmation and verify ATAs exist
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify ATAs actually exist now
      for (const owner of owners) {
        const { exists } = await checkATAExists(connection, usdcMint, owner);
        if (!exists) {
          throw new Error(`Failed to create ATA for ${owner.toString()}`);
        }
      }
      console.log(`✅ All ATAs confirmed to exist`);
    }
    
    // STEP 2: Get ATA addresses (now guaranteed to exist)
    const senderTokenAccount = await getAssociatedTokenAddress(usdcMint, wallet.publicKey);
    const recipientTokenAccount = await getAssociatedTokenAddress(usdcMint, recipientPublicKey);
    
    console.log(`📤 From: ${senderTokenAccount.toString()}`);
    console.log(`📥 To: ${recipientTokenAccount.toString()}`);
    
    // STEP 3: Create transfer transaction (no ATA creation needed)
    const transaction = new Transaction();
    
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
    
    // Simulate transaction before sending
    const simulation = await simulateTransaction(connection, transaction);
    if (!simulation.success) {
      throw new Error(simulation.error || "Transaction simulation failed");
    }
    
    console.log('🚀 Sending DEVNET USDC transfer transaction...');
    
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
    
    console.log('✅ DEVNET USDC transfer confirmed successfully');
    return signature;
    
  } catch (error: any) {
    console.error("❌ Error in DEVNET USDC transfer:", error);
    
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
    
    throw new Error(error.message || "Failed to process DEVNET USDC transfer");
  }
};

// Process multiple USDC payments with 80/20 split
export const processMultipleUSDCPayments = async (
  items: { price: number, producerWallet: string, id?: string, title?: string }[],
  connection: Connection, 
  wallet: WalletContextState,
  network: string = 'devnet'
): Promise<string[]> => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    
    // FORCE DEVNET
    const forceDevnet = 'devnet';
    console.log(`💰 Processing ${items.length} DEVNET USDC payments with 80/20 split`);
    
    // Validate all recipient addresses first
    for (const item of items) {
      if (!isValidSolanaAddress(item.producerWallet)) {
        throw new Error(`Invalid recipient address: ${item.producerWallet}`);
      }
    }
    
    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
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
