
import { useEffect, useCallback, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWalletSync = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const { user, forceUserDataRefresh } = useAuth();
  const syncInProgress = useRef(false);
  const lastSyncedWallet = useRef<string | null>(null);
  const lastSyncAttempt = useRef<number>(0);
  const syncCooldownMs = 2000;
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  const syncWalletToDatabase = useCallback(async (walletAddress: string | null): Promise<boolean> => {
    console.log('🔄 syncWalletToDatabase called with:', { 
      walletAddress, 
      userId: user?.id,
      userWalletInContext: user?.wallet_address 
    });
    
    if (syncInProgress.current) {
      console.log('⏸️ Wallet sync already in progress, skipping...');
      return false;
    }

    const now = Date.now();
    if (now - lastSyncAttempt.current < syncCooldownMs) {
      console.log('⏸️ Wallet sync cooldown active, skipping...');
      return false;
    }

    if (!user?.id) {
      console.log('❌ Cannot sync wallet: User not authenticated');
      setLastError('User not authenticated');
      if (walletAddress) {
        toast.error('Please log in to sync your wallet address');
      }
      return false;
    }

    if (lastSyncedWallet.current === walletAddress) {
      console.log('✅ Wallet address unchanged, skipping sync');
      return true;
    }

    syncInProgress.current = true;
    lastSyncAttempt.current = now;
    setSyncStatus('syncing');
    setLastError(null);

    try {
      console.log(`🔄 Attempting to sync wallet: ${walletAddress || 'null'} for user ${user.id}`);
      
      // Enhanced database update with explicit logging
      const updateData = { wallet_address: walletAddress };
      console.log('📝 Updating database with:', updateData);
      
      const { data, error, count } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select('id, wallet_address, email')
        .single();

      if (error) {
        console.error('❌ Database error syncing wallet:', error);
        console.error('🔍 Full error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        setLastError(error.message);
        setSyncStatus('error');
        toast.error(`Failed to sync wallet: ${error.message}`);
        return false;
      }

      if (!data) {
        const errorMsg = 'No data returned from wallet update - user may not exist';
        console.error('❌ ' + errorMsg);
        setLastError(errorMsg);
        setSyncStatus('error');
        toast.error('Failed to sync wallet: User not found');
        return false;
      }

      const updatedWallet = data.wallet_address;
      console.log('✅ Database update successful:', {
        expected: walletAddress,
        actual: updatedWallet,
        userId: user.id,
        userEmail: data.email
      });

      // Verify the update was successful
      if (updatedWallet !== walletAddress) {
        console.warn('⚠️ Database update mismatch:', {
          expected: walletAddress,
          actual: updatedWallet
        });
      }

      lastSyncedWallet.current = walletAddress;
      setSyncStatus('success');

      // Force refresh user data with enhanced feedback
      console.log('🔄 Forcing user data refresh...');
      const refreshSuccess = await forceUserDataRefresh();
      if (!refreshSuccess) {
        console.warn('⚠️ User data refresh failed after wallet sync');
        toast.warning('Wallet synced but profile may need refresh');
      } else {
        console.log('✅ User data refreshed successfully');
      }

      // Enhanced success messages
      if (walletAddress) {
        toast.success('Wallet connected and saved to your profile!', {
          description: `Address: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}`
        });
      } else {
        toast.success('Wallet disconnected and removed from profile');
      }
      
      return true;

    } catch (error) {
      console.error('❌ Exception in wallet sync:', error);
      
      // Handle RLS policy errors with retry
      if (error instanceof Error && 
          (error.message.includes('PGRST301') || 
           error.message.includes('permission') || 
           error.message.includes('policy'))) {
        console.warn('⚠️ RLS policy issue detected, retrying after delay...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Retry once
        try {
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .update({ wallet_address: walletAddress })
            .eq('id', user.id)
            .select('id, wallet_address')
            .single();
            
          if (!retryError && retryData) {
            console.log('✅ Wallet synced successfully on retry');
            lastSyncedWallet.current = walletAddress;
            setSyncStatus('success');
            await forceUserDataRefresh();
            toast.success('Wallet synced successfully');
            return true;
          }
        } catch (retryErr) {
          console.error('❌ Retry failed:', retryErr);
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      setSyncStatus('error');
      toast.error(`Failed to sync wallet: ${errorMessage}`);
      return false;
    } finally {
      syncInProgress.current = false;
    }
  }, [user?.id, user?.wallet_address, forceUserDataRefresh]);

  const manualSyncTrigger = useCallback(async (): Promise<boolean> => {
    console.log('🔧 Manual sync trigger called');
    
    // Reset cooldown for manual sync
    lastSyncAttempt.current = 0;
    
    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      console.log('🔧 Manual sync - wallet connected:', walletAddress);
      return await syncWalletToDatabase(walletAddress);
    } else {
      console.log('🔧 Manual sync - no wallet connected, clearing stored wallet');
      return await syncWalletToDatabase(null);
    }
  }, [connected, publicKey, syncWalletToDatabase]);

  useEffect(() => {
    console.log('🔄 useWalletSync useEffect triggered with:', {
      connected,
      publicKey: publicKey?.toString(),
      userId: user?.id,
      userWalletAddress: user?.wallet_address,
      syncInProgress: syncInProgress.current,
      lastSyncedWallet: lastSyncedWallet.current
    });

    if (!user) {
      console.log('⏸️ No user data loaded yet, waiting...');
      return;
    }

    if (syncInProgress.current) {
      console.log('⏸️ Sync already in progress, skipping...');
      return;
    }

    const connectedWalletAddress = connected && publicKey ? publicKey.toString() : null;
    const storedWalletAddress = user.wallet_address;

    console.log('📊 Comparing wallet states:', {
      connectedWallet: connectedWalletAddress,
      storedWallet: storedWalletAddress,
      lastSynced: lastSyncedWallet.current
    });

    let shouldSync = false;
    let reason = '';

    if (connectedWalletAddress && connectedWalletAddress !== storedWalletAddress) {
      shouldSync = true;
      reason = 'Connected wallet differs from stored wallet';
    } else if (!connectedWalletAddress && storedWalletAddress && lastSyncedWallet.current) {
      shouldSync = true;
      reason = 'Wallet disconnected but stored wallet exists';
    }

    if (shouldSync) {
      console.log(`🔄 Sync needed: ${reason}`);
      setTimeout(() => {
        syncWalletToDatabase(connectedWalletAddress);
      }, 500);
    } else {
      console.log('✅ No sync needed - wallet states match');
      if (connectedWalletAddress) {
        lastSyncedWallet.current = connectedWalletAddress;
        setSyncStatus('success');
      }
    }
  }, [connected, publicKey?.toString(), user?.id, user?.wallet_address, syncWalletToDatabase]);

  const disconnectAndSync = useCallback(async () => {
    try {
      console.log('🔌 Disconnecting and syncing wallet...');
      await disconnect();
      if (user?.id) {
        await syncWalletToDatabase(null);
      }
    } catch (error) {
      console.error('❌ Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  }, [disconnect, syncWalletToDatabase, user?.id]);

  const connectedWalletAddress = publicKey?.toString();
  const storedWalletAddress = user?.wallet_address;
  
  const isWalletSynced = connected && publicKey && user?.id && 
                        connectedWalletAddress === storedWalletAddress &&
                        syncStatus !== 'error';
  
  const needsAuth = connected && publicKey && !user?.id;
  
  const walletMismatch = connected && publicKey && user?.id && 
                        storedWalletAddress && 
                        connectedWalletAddress !== storedWalletAddress &&
                        syncStatus !== 'syncing';

  console.log('📊 Final wallet sync status:', {
    isWalletSynced,
    needsAuth,
    walletMismatch,
    isConnected: connected,
    syncStatus,
    lastError
  });

  return {
    syncWalletToDatabase,
    disconnectAndSync,
    manualSyncTrigger,
    isWalletSynced,
    needsAuth,
    walletMismatch,
    isConnected: connected,
    walletAddress: connectedWalletAddress,
    storedWalletAddress,
    syncStatus,
    lastError
  };
};
