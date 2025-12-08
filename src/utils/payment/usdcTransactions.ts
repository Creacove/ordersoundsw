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
import { createMemoInstruction } from '@solana/spl-memo';
import { toast } from 'sonner';
// Smart contract imports removed for direct transfer with platform fee - Holiday Promo Active

// USDC Mint addresses for different networks
const USDC_MINT_ADDRESSES = {
  'mainnet-beta': new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  'devnet': new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
  'testnet': new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
};

// Get current network's USDC mint - dynamic selection
const getUSDCMint = (network: string = 'devnet'): PublicKey => {
  const normalizedNetwork = network === 'mainnet' ? 'mainnet-beta' : network;
  const mint = USDC_MINT_ADDRESSES[normalizedNetwork as keyof typeof USDC_MINT_ADDRESSES] || USDC_MINT_ADDRESSES.devnet;
  console.log(`🌐 Using ${normalizedNetwork} USDC mint: ${mint.toString()}`);
  return mint;
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

// Platform wallet for receiving 20% fee (dynamic selection)
const getPlatformWallet = (network: string = 'devnet'): PublicKey => {
  const isMainnet = network === 'mainnet' || network === 'mainnet-beta';
  const walletAddress = isMainnet 
    ? (import.meta.env.VITE_PLATFORM_WALLET_MAINNET || import.meta.env.VITE_PLATFORM_WALLET || '9SqtDXzFnisGKMrhwUt81BCUixC7BnuA7ppQ3vPiAFpf')
    : (import.meta.env.VITE_PLATFORM_WALLET || '9SqtDXzFnisGKMrhwUt81BCUixC7BnuA7ppQ3vPiAFpf');
  console.log(`🏢 Using ${network} platform wallet: ${walletAddress}`);
  return new PublicKey(walletAddress);
};

// Process atomic split payment - single transaction with two transfers
const processAtomicSplitPayment = async (
  producerAmount: number,
  platformAmount: number,
  connection: Connection,
  wallet: WalletContextState,
  network: string,
  atas: { senderATA: PublicKey; producerATA: PublicKey; platformATA: PublicKey }
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    
    const usdcMint = getUSDCMint(network);
    const producerUSDCAmount = usdToUSDCUnits(producerAmount);
    const platformUSDCAmount = usdToUSDCUnits(platformAmount);
    
    console.log(`🔄 Creating atomic split transaction:`);
    console.log(`  🎵 Producer: ${producerAmount} USDC (${producerUSDCAmount.toString()} units)`);
    console.log(`  🏢 Platform: ${platformAmount} USDC (${platformUSDCAmount.toString()} units)`);
    
    // Check sender's USDC balance
    const { balance: senderBalance, hasAccount: senderHasAccount } = await checkUSDCBalance(
      connection, 
      wallet.publicKey, 
      usdcMint
    );
    
    const totalAmount = producerUSDCAmount + platformUSDCAmount;
    if (!senderHasAccount || senderBalance < totalAmount) {
      const availableUSDC = Number(senderBalance) / 1_000_000;
      const requiredUSDC = Number(totalAmount) / 1_000_000;
      const networkLabel = network === 'mainnet' || network === 'mainnet-beta' ? 'MAINNET' : 'DEVNET';
      throw new Error(`Insufficient ${networkLabel} USDC balance. You have ${availableUSDC.toFixed(2)} USDC but need ${requiredUSDC.toFixed(2)} USDC.`);
    }
    
    // Create single transaction with memo + transfer instructions
    const transaction = new Transaction();
    
    // Add memo instruction FIRST for wallet preview clarity
    const totalUSDC = (producerAmount + platformAmount).toFixed(2);
    // TODO: HOLIDAY PROMO - Revert memo after January 31, 2025
    // Original: const memoText = `USDC Payment: $${totalUSDC} total ($${producerAmount.toFixed(2)} to producer + $${platformAmount.toFixed(2)} platform fee)`;
    const memoText = platformAmount > 0 
      ? `USDC Payment: $${totalUSDC} total ($${producerAmount.toFixed(2)} to producer + $${platformAmount.toFixed(2)} platform fee)`
      : `USDC Payment: $${totalUSDC} (100% to producer - Holiday Promo 🎉)`;
    const memoInstruction = createMemoInstruction(memoText, [wallet.publicKey]);
    transaction.add(memoInstruction);
    
    console.log(`📝 Added memo: ${memoText}`);
    
    // Producer transfer instruction (100% during promo)
    const producerTransfer = createTransferInstruction(
      atas.senderATA,
      atas.producerATA,
      wallet.publicKey,
      producerUSDCAmount,
      [],
      TOKEN_PROGRAM_ID
    );
    
    // Add producer transfer
    transaction.add(producerTransfer);
    
    // TODO: HOLIDAY PROMO - Uncomment platform transfer after January 31, 2025
    // Platform transfer instruction - SKIP when platformAmount is 0 (promo period)
    if (platformUSDCAmount > BigInt(0)) {
      const platformTransfer = createTransferInstruction(
        atas.senderATA,
        atas.platformATA,
        wallet.publicKey,
        platformUSDCAmount,
        [],
        TOKEN_PROGRAM_ID
      );
      transaction.add(platformTransfer);
    }
    
    // Set transaction metadata
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // TODO: HOLIDAY PROMO - Update log after January 31, 2025
    const transferCount = platformUSDCAmount > BigInt(0) ? 2 : 1;
    console.log(`🧪 Transaction contains ${transaction.instructions.length} instructions (1 memo + ${transferCount} transfer${transferCount > 1 ? 's' : ''})`);
    
    // Simulate transaction before sending
    const simulation = await simulateTransaction(connection, transaction);
    if (!simulation.success) {
      throw new Error(simulation.error || "Atomic transaction simulation failed");
    }
    
    console.log('🚀 Sending atomic split transaction (single authorization)...');
    
    // Sign and send the transaction (user authorizes once for both transfers)
    const signature = await wallet.sendTransaction(transaction, connection, {
      maxRetries: 5,
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
    
    console.log(`📋 Atomic split transaction signature: ${signature}`);
    
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
      throw new Error(`Atomic transaction failed to confirm: ${confirmation?.value.err?.toString() || 'Timeout'}`);
    }
    
    console.log('✅ Atomic split transaction confirmed - both transfers completed');
    return signature;
    
  } catch (error: any) {
    console.error("❌ Error in atomic split payment:", error);
    
    // Provide specific error messages
    if (error.message.includes('0x1')) {
      throw new Error("Insufficient SOL balance for transaction fees. Please add SOL to your wallet.");
    }
    if (error.message.includes('TokenAccountNotFoundError')) {
      const networkLabel = network === 'mainnet' || network === 'mainnet-beta' ? 'MAINNET' : 'DEVNET';
      throw new Error(`${networkLabel} USDC token account not found. Please ensure you have ${networkLabel} USDC in your wallet.`);
    }
    if (error.message.includes('insufficient funds')) {
      const networkLabel = network === 'mainnet' || network === 'mainnet-beta' ? 'MAINNET' : 'DEVNET';
      throw new Error(`Insufficient ${networkLabel} USDC balance for this transaction.`);
    }
    
    throw new Error(error.message || "Failed to process atomic split payment");
  }
};

// Process platform-only payment (100% to platform wallet)
export const processPlatformOnlyPayment = async (
  usdAmount: number,
  connection: Connection,
  wallet: WalletContextState,
  network: string = 'devnet'
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    
    const activeNetwork = network || import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
    console.log(`💰 Processing ${activeNetwork.toUpperCase()} platform-only payment: $${usdAmount}`);
    
    const PLATFORM_WALLET = getPlatformWallet(activeNetwork);
    
    // Use direct transfer to platform wallet
    const signature = await processSingleDirectTransfer(
      usdAmount,
      PLATFORM_WALLET.toString(),
      connection,
      wallet,
      activeNetwork,
      'platform'
    );
    
    console.log(`✅ Platform-only payment completed: ${signature}`);
    return signature;
  } catch (error: any) {
    console.error("❌ Error in platform-only payment:", error);
    throw new Error(error.message || "Failed to process platform-only payment");
  }
};

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
      
      // Handle missing producer wallet by using platform-only payment
      if (!recipientAddress || recipientAddress.trim() === '') {
        console.log(`⚠️  Missing producer wallet, using platform-only payment for $${usdAmount}`);
        return await processPlatformOnlyPayment(usdAmount, connection, wallet, network);
      }
      
      if (!isValidSolanaAddress(recipientAddress)) throw new Error("Invalid recipient address");
      
      // Use provided network or environment default
      const activeNetwork = network || import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
      // TODO: HOLIDAY PROMO - Revert to 80/20 split after January 31, 2025
      console.log(`💰 Processing ${activeNetwork.toUpperCase()} USDC payment with 100/0 split (Holiday Promo): $${usdAmount} to ${recipientAddress}`);
    
    // Calculate splits: 100% to producer, 0% to platform (HOLIDAY PROMO)
    // Original: const producerAmount = usdAmount * 0.8;
    // Original: const platformAmount = usdAmount * 0.2;
    const producerAmount = usdAmount * 1.0; // 100% to producer during promo
    const platformAmount = usdAmount * 0.0; // 0% to platform during promo
    
    console.log(`🎯 Producer gets: $${producerAmount.toFixed(2)} (100% - Holiday Promo 🎉)`);
    console.log(`🏢 Platform gets: $${platformAmount.toFixed(2)} (0% - Holiday Promo)`);
    
    const usdcMint = getUSDCMint(activeNetwork);
    const producerPublicKey = new PublicKey(recipientAddress);
    const PLATFORM_WALLET = getPlatformWallet(activeNetwork);
    
    // CRITICAL: Check and create ALL THREE ATAs before any transfers
    const allWallets = [wallet.publicKey, producerPublicKey, PLATFORM_WALLET];
    const walletLabels = ['sender', 'producer', 'platform'];
    
    console.log(`🔍 Checking ATAs for all 3 wallets on ${activeNetwork}:`);
    console.log(`  💳 Sender: ${wallet.publicKey.toString()}`);
    console.log(`  🎵 Producer: ${producerPublicKey.toString()}`);
    console.log(`  🏢 Platform: ${PLATFORM_WALLET.toString()}`);
    
    // Check which ATAs are missing
    const missingATAs: { owner: PublicKey; ata: PublicKey; label: string }[] = [];
    
    for (let i = 0; i < allWallets.length; i++) {
      const owner = allWallets[i];
      const label = walletLabels[i];
      const { exists, address } = await checkATAExists(connection, usdcMint, owner);
      
      if (!exists) {
        missingATAs.push({ owner, ata: address, label });
        console.log(`❌ Missing ATA for ${label}: ${address.toString()}`);
      } else {
        console.log(`✅ ATA exists for ${label}: ${address.toString()}`);
      }
    }
    
    // Create missing ATAs if needed
    if (missingATAs.length > 0) {
      console.log(`🏗️  Creating ${missingATAs.length} missing ATAs...`);
      const ataCreationSignature = await createMissingATAs(connection, wallet, usdcMint, allWallets);
      
      if (ataCreationSignature) {
        console.log(`⏳ Waiting for ATA creation to settle...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verify all ATAs exist now
        for (let i = 0; i < allWallets.length; i++) {
          const owner = allWallets[i];
          const label = walletLabels[i];
          const { exists, address } = await checkATAExists(connection, usdcMint, owner);
          
          if (!exists) {
            throw new Error(`Failed to create ${label} ATA for ${owner.toString()} (expected at ${address.toString()})`);
          }
          console.log(`✅ Verified ${label} ATA exists: ${address.toString()}`);
        }
      }
    }
    
    // Get pre-computed ATA addresses (guaranteed to exist)
    const senderATA = await getAssociatedTokenAddress(usdcMint, wallet.publicKey);
    const producerATA = await getAssociatedTokenAddress(usdcMint, producerPublicKey);
    const platformATA = await getAssociatedTokenAddress(usdcMint, PLATFORM_WALLET);
    
    console.log(`📍 Using verified ATAs:`);
    console.log(`  💳 Sender ATA: ${senderATA.toString()}`);
    console.log(`  🎵 Producer ATA: ${producerATA.toString()}`);
    console.log(`  🏢 Platform ATA: ${platformATA.toString()}`);
    
    // Process atomic split payment with single authorization
    const signature = await processAtomicSplitPayment(
      producerAmount,
      platformAmount,
      connection,
      wallet,
      activeNetwork,
      { senderATA, producerATA, platformATA }
    );
    
    console.log(`✅ Atomic split payment completed: ${signature}`);
    return signature;
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
  recipient: 'producer' | 'platform',
  precomputedATAs?: { senderATA: PublicKey; recipientATA: PublicKey }
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
      const networkLabel = network === 'mainnet' || network === 'mainnet-beta' ? 'MAINNET' : 'DEVNET';
      throw new Error(`You don't have a USDC token account. Please fund your wallet with ${networkLabel} USDC first.`);
    }
    
    if (senderBalance < usdcAmount) {
      const availableUSDC = Number(senderBalance) / 1_000_000;
      const networkLabel = network === 'mainnet' || network === 'mainnet-beta' ? 'MAINNET' : 'DEVNET';
      throw new Error(`Insufficient ${networkLabel} USDC balance. You have ${availableUSDC.toFixed(2)} USDC but need ${usdAmount} USDC.`);
    }
    
    // Use precomputed ATAs if provided, otherwise compute them
    let senderTokenAccount: PublicKey;
    let recipientTokenAccount: PublicKey;
    
    if (precomputedATAs) {
      // Use the pre-verified ATAs from parent function
      senderTokenAccount = precomputedATAs.senderATA;
      recipientTokenAccount = precomputedATAs.recipientATA;
      console.log(`🎯 Using precomputed ATAs for ${recipient} payment`);
    } else {
      // Fallback: compute ATAs (for backward compatibility)
      const recipientPublicKey = new PublicKey(recipientAddress);
      senderTokenAccount = await getAssociatedTokenAddress(usdcMint, wallet.publicKey);
      recipientTokenAccount = await getAssociatedTokenAddress(usdcMint, recipientPublicKey);
      console.log(`⚠️  Computing ATAs on-the-fly for ${recipient} payment`);
    }
    
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
    
    const networkLabel = network === 'mainnet' || network === 'mainnet-beta' ? 'MAINNET' : 'DEVNET';
    console.log(`🚀 Sending ${networkLabel} USDC transfer transaction...`);
    
    // Sign and send the transaction
    const signature = await wallet.sendTransaction(transaction, connection, {
      maxRetries: 5,
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
    
    console.log(`📋 ${networkLabel} USDC transfer signature: ${signature}`);
    
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
    
    console.log(`✅ ${networkLabel} USDC transfer confirmed successfully`);
    return signature;
    
  } catch (error: any) {
    const networkLabel = network === 'mainnet' || network === 'mainnet-beta' ? 'MAINNET' : 'DEVNET';
    console.error(`❌ Error in ${networkLabel} USDC transfer:`, error);
    
    // Provide specific error messages for common issues
    if (error.message.includes('0x1')) {
      throw new Error("Insufficient SOL balance for transaction fees. Please add SOL to your wallet.");
    }
    if (error.message.includes('TokenAccountNotFoundError')) {
      throw new Error(`${networkLabel} USDC token account not found. Please ensure you have ${networkLabel} USDC in your wallet.`);
    }
    if (error.message.includes('insufficient funds')) {
      throw new Error(`Insufficient ${networkLabel} USDC balance for this transaction.`);
    }
    
    throw new Error(error.message || `Failed to process ${networkLabel} USDC transfer`);
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
    
    // Use provided network or environment default
    const activeNetwork = network || import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
    const networkLabel = activeNetwork === 'mainnet' || activeNetwork === 'mainnet-beta' ? 'MAINNET' : 'DEVNET';
    console.log(`💰 Processing ${items.length} ${networkLabel} USDC payments with 80/20 split`);
    
    // Validate recipient addresses and separate fallback items
    const validItems = items.filter(item => item.producerWallet && isValidSolanaAddress(item.producerWallet));
    const fallbackItems = items.filter(item => !item.producerWallet);
    
    if (fallbackItems.length > 0) {
      console.log(`${fallbackItems.length} items will require platform fallback payment`);
    }
    
    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
    const usdcMint = getUSDCMint(activeNetwork);
    
    // Check total USDC balance before processing any transactions
    const { balance: senderBalance, hasAccount: senderHasAccount } = await checkUSDCBalance(
      connection, 
      wallet.publicKey, 
      usdcMint
    );
    
    if (!senderHasAccount) {
      throw new Error(`You don't have a ${networkLabel} USDC token account. Please fund your wallet with ${networkLabel} USDC first.`);
    }
    
    const availableUSDC = Number(senderBalance) / 1_000_000;
    if (availableUSDC < totalAmount) {
      throw new Error(`Insufficient ${networkLabel} USDC balance. You have ${availableUSDC.toFixed(2)} USDC but need ${totalAmount.toFixed(2)} USDC.`);
    }
    
    const signatures: string[] = [];
    
    // Process valid items with normal 80/20 split
    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      try {
        console.log(`📦 Processing ${networkLabel} payment ${i + 1}/${validItems.length}: $${item.price} to ${item.producerWallet}`);
        
        const signature = await processUSDCPayment(
          item.price,
          item.producerWallet!,
          connection,
          wallet,
          activeNetwork
        );
        signatures.push(signature);
        
        // Small delay between transactions
        if (i < validItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`❌ Failed ${networkLabel} USDC payment to ${item.producerWallet}:`, error);
        throw error;
      }
    }
    
    // Process fallback items with platform-only payment
    if (fallbackItems.length > 0) {
      const fallbackAmount = fallbackItems.reduce((sum, item) => sum + item.price, 0);
      console.log(`📦 Processing platform fallback payment: $${fallbackAmount} for ${fallbackItems.length} items`);
      
      try {
        const fallbackSignature = await processPlatformOnlyPayment(
          fallbackAmount,
          connection,
          wallet,
          activeNetwork
        );
        signatures.push(fallbackSignature);
      } catch (error: any) {
        console.error(`❌ Failed platform fallback payment:`, error);
        throw error;
      }
    }
    
    console.log(`✅ All ${items.length} ${networkLabel} USDC payments completed successfully`);
    return signatures;
    
  } catch (error: any) {
    const activeNetwork = network || import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
    const networkLabel = activeNetwork === 'mainnet' || activeNetwork === 'mainnet-beta' ? 'MAINNET' : 'DEVNET';
    console.error(`❌ Error processing multiple ${networkLabel} USDC payments:`, error);
    throw new Error(error.message || `Failed to process ${networkLabel} USDC payments`);
  }
};
