
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from "@/components/ui/button";
import { useWalletSync } from '@/hooks/useWalletSync';
import { useAuth } from '@/context/AuthContext';
import { Wallet, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletButtonProps {
  className?: string;
  buttonClass?: string;
}

const WalletButton: React.FC<WalletButtonProps> = ({ className, buttonClass }) => {
  const { connected, connecting, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { user } = useAuth();
  const { 
    isWalletSynced, 
    needsAuth, 
    walletMismatch, 
    syncStatus, 
    manualSyncTrigger,
    storedWalletAddress 
  } = useWalletSync();

  const handleConnect = () => {
    if (!connected && !connecting) {
      setVisible(true);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const handleForceSync = async () => {
    try {
      await manualSyncTrigger();
    } catch (error) {
      console.error('Error in manual sync:', error);
    }
  };

  // Show different states based on wallet and auth status
  const renderWalletState = () => {
    if (connecting) {
      return (
        <Button 
          disabled 
          className={cn("gap-2", buttonClass)}
        >
          <RefreshCw className="h-4 w-4 animate-spin" />
          Connecting...
        </Button>
      );
    }

    if (!connected) {
      return (
        <Button 
          onClick={handleConnect}
          className={cn("gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0", buttonClass)}
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      );
    }

    if (needsAuth) {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Login required to sync wallet
          </div>
          <Button 
            onClick={handleDisconnect}
            variant="outline"
            className={cn("gap-2", buttonClass)}
          >
            <Wallet className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
      );
    }

    if (walletMismatch) {
      return (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Wallet mismatch detected
            </div>
            <div className="text-xs">
              Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
            </div>
            <div className="text-xs">
              Saved: {storedWalletAddress?.slice(0, 8)}...{storedWalletAddress?.slice(-8)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleForceSync}
              size="sm"
              className={cn("gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white border-0", buttonClass)}
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Force Sync
            </Button>
            <Button 
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              className={cn("gap-2", buttonClass)}
            >
              <Wallet className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>
      );
    }

    if (syncStatus === 'syncing') {
      return (
        <Button 
          disabled 
          className={cn("gap-2", buttonClass)}
        >
          <RefreshCw className="h-4 w-4 animate-spin" />
          Syncing Wallet...
        </Button>
      );
    }

    if (syncStatus === 'error') {
      return (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Sync failed
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleForceSync}
              size="sm"
              className={cn("gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white border-0", buttonClass)}
            >
              <RefreshCw className="h-4 w-4" />
              Retry Sync
            </Button>
            <Button 
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              className={cn("gap-2", buttonClass)}
            >
              <Wallet className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>
      );
    }

    if (isWalletSynced) {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
            <Check className="h-4 w-4" />
            Wallet connected & saved
          </div>
          <div className="text-xs text-muted-foreground">
            {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
          </div>
          <Button 
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className={cn("gap-2", buttonClass)}
          >
            <Wallet className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
      );
    }

    // Default connected state
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm -purple- dark:-purple-">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet connected
          </div>
          <div className="text-xs mt-1">
            {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
          </div>
        </div>
        <Button 
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className={cn("gap-2", buttonClass)}
        >
          <Wallet className="h-4 w-4" />
          Disconnect
        </Button>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {renderWalletState()}
    </div>
  );
};

export default WalletButton;
