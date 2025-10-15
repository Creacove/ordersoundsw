import { createContext, useContext, useEffect } from 'react';
import { User } from '@/types';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { useAuthMethods } from '@/hooks/auth/useAuthMethods';
import { toast } from 'sonner';
import { logSessionEvent } from '@/lib/authLogger';
import { initiateRecoveryFlow } from '@/lib/authLogger';
import { supabase } from '@/integrations/supabase/client';

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
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, status, full_name, country, bio, profile_picture, stage_name, wallet_address')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Force user data refresh error:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setAuthError(`User data refresh failed: ${error.message}`);
        await logSessionEvent('user_refresh_failed', { 
          error: error.message,
          user_id: user.id
        });
        return false;
      }
      
      if (!userData) {
        console.error("No user data found during forced refresh");
        setAuthError("User data refresh failed: No data found");
        await logSessionEvent('user_refresh_no_data', { user_id: user.id });
        return false;
      }
      
      // FIX: Ensure wallet_address is properly updated
      setUser({
        ...user,
        role: userData.role as 'buyer' | 'producer' | 'admin',
        status: userData.status as 'active' | 'inactive',
        name: userData.full_name || user.name,
        bio: userData.bio || user.bio || '',
        country: userData.country || user.country || '',
        avatar_url: userData.profile_picture || user.avatar_url || '',
        producer_name: userData.stage_name || user.producer_name || '',
        wallet_address: userData.wallet_address || ''
      });
      
      console.log('User data refreshed successfully, wallet_address:', userData.wallet_address);
      
      setAuthError(null);
      setConsecutiveErrors(0);
      await logSessionEvent('user_refresh_success', { user_id: user.id });
      return true;
    } catch (error: any) {
      console.error("Exception in forceUserDataRefresh:", error);
      setAuthError(`Error refreshing user data: ${error.message}`);
      await logSessionEvent('user_refresh_exception', { 
        error: error.message,
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

  useEffect(() => {
    const initAuth = async () => {
      if (!isLoading && !user) {
        try {
          await refreshSession();
        } catch (error) {
          console.log('Silent session refresh attempt failed');
        }
      }
    };
    
    initAuth();
  }, []);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
