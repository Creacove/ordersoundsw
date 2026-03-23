import { createContext, useContext, useEffect } from 'react';
import { User } from '@/types';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { useAuthMethods } from '@/hooks/auth/useAuthMethods';
import { toast } from 'sonner';
import { logSessionEvent } from '@/lib/authLogger';
import { initiateRecoveryFlow } from '@/lib/authLogger';
import { supabase } from '@/integrations/supabase/client';
import { loadAppUser } from '@/features/auth/profileService';

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  currency: 'NGN' | 'USD';
  setCurrency: (currency: 'NGN' | 'USD') => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'buyer' | 'producer', referralCode?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateUserInfo: (user: User) => void;
  isProducerInactive: boolean;
  authError: string | null;
  refreshSession: () => Promise<boolean>;
  recoverSession: (email?: string) => void;
  forceUserDataRefresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { 
    user, 
    setUser, 
    currency, 
    setCurrency, 
    isLoading, 
    setIsLoading,
    authError,
    setAuthError,
    appVersion,
    consecutiveErrors,
    setConsecutiveErrors
  } = useAuthState();
  
  const { 
    login, 
    signup, 
    logout, 
    updateProfile,
    refreshSession
  } = useAuthMethods({ 
    setUser, 
    setCurrency, 
    setIsLoading,
    setAuthError,
    setConsecutiveErrors,
    appVersion
  });

  const updateUserInfo = (updatedUser: User) => {
    setUser(updatedUser);
    setConsecutiveErrors(0);
  };

  const isProducerInactive = false;

  const forceUserDataRefresh = async (): Promise<boolean> => {
    if (!user) {
      console.log("Cannot refresh user data, no user in context");
      return false;
    }
    
    setIsLoading(true);
    try {
      console.log(`Forcing refresh of user data for ${user.id}`);
      const { data: authData, error: authUserError } = await supabase.auth.getUser();

      if (authUserError || !authData.user) {
        throw authUserError || new Error('No authenticated user found');
      }

      const refreshedUser = await loadAppUser(authData.user);
      setUser(refreshedUser);
      
      console.log('User data refreshed successfully, wallet_address:', refreshedUser.wallet_address);
      
      setAuthError(null);
      setConsecutiveErrors(0);
      await logSessionEvent('user_refresh_success', { user_id: user.id });
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to refresh user data');
      console.error("Exception in forceUserDataRefresh:", error);
      setAuthError(`Error refreshing user data: ${message}`);
      await logSessionEvent('user_refresh_exception', { 
        error: message,
        user_id: user.id
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
    
  const recoverSession = (email?: string) => {
    initiateRecoveryFlow(email);
  };
  
  useEffect(() => {
    if (authError) {
      console.error('Authentication error:', authError);
      if (!authError.includes('[silent]')) {
        toast.error(`Authentication error: ${authError}`);
      }
      
      if (user) {
        logSessionEvent('auth_error', { 
          error: authError,
          user_id: user.id
        });
      } else {
        logSessionEvent('auth_error', { error: authError });
      }
      
      if (consecutiveErrors >= 3 && !authError.includes('[silent]')) {
        toast.error(
          "We're having trouble with your session. Please try logging in again.", 
          { 
            action: {
              label: "Fix Now",
              onClick: () => initiateRecoveryFlow(user?.email)
            }
          }
        );
      }
    }
  }, [authError, user, consecutiveErrors]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        currency,
        setCurrency,
        login,
        signup,
        logout,
        updateProfile,
        updateUserInfo,
        isProducerInactive,
        authError,
        refreshSession,
        recoverSession,
        forceUserDataRefresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
