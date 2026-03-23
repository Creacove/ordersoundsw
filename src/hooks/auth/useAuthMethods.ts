import { useState } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { uniqueToast } from '@/lib/toast';
import { logSessionEvent } from '@/lib/authLogger';
import {
  ensureUserProfile,
  loadAppUser,
  toAppUser,
  updateUserProfileRecord,
} from '@/features/auth/profileService';

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

interface AuthMethodsProps {
  setUser: (user: User | null) => void;
  setCurrency: (currency: 'NGN' | 'USD') => void;
  setIsLoading: (isLoading: boolean) => void;
  setAuthError: (error: string | null) => void;
  setConsecutiveErrors?: (value: number) => void;
  appVersion?: {
    current: string;
    previous: string | null;
    hasChanged: boolean;
  };
}

export const useAuthMethods = ({ 
  setUser, 
  setCurrency, 
  setIsLoading,
  setAuthError,
  setConsecutiveErrors = () => {},
  appVersion 
}: AuthMethodsProps) => {
  const navigate = useNavigate();
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);

  const refreshSession = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      if (isRefreshingSession) {
        console.log('Session refresh already in progress, skipping duplicate call');
        return false;
      }

      setIsRefreshingSession(true);
      console.log('Attempting to refresh session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        setAuthError(`[silent] Refresh session failed: ${error.message}`);
        
        await logSessionEvent('refresh_failed', { error: error.message });
        
        if (appVersion?.hasChanged) {
          uniqueToast.error('Please login again due to a recent update');
        }
        
        return false;
      }
      
      if (data?.session && data?.user) {
        console.log('Session refreshed successfully');
        await logSessionEvent('refresh_success', { user_id: data.user.id });

        const refreshedUser = await loadAppUser(data.user);
        setUser(refreshedUser);
        
        setConsecutiveErrors(0);
        
        return true;
      } else {
        console.log('No session data returned');
        setAuthError('[silent] No session data returned from refresh');
        await logSessionEvent('refresh_no_data');
        return false;
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to refresh session');
      console.error('Error refreshing session:', error);
      setAuthError(`[silent] Error in refresh session: ${message}`);
      await logSessionEvent('refresh_exception', { error: message });
      return false;
    } finally {
      setIsLoading(false);
      setIsRefreshingSession(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Attempting login with:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Login error:", error);
        
        if (error.message.includes("Email not confirmed") || error.code === "email_not_confirmed") {
          uniqueToast.error("Email not confirmed. Please check your inbox for a confirmation email or try signing up again.");
          setIsLoading(false);
          return;
        }
        
        uniqueToast.error(error.message || 'Failed to log in');
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        console.log("Login successful:", data.user.id);
        navigate('/auth/callback');
        return;
      }
      
      uniqueToast.error("Failed to login. Please try again.");
      
    } catch (error: unknown) {
      console.error('Login error:', error);
      uniqueToast.error(getErrorMessage(error, 'Failed to log in'));
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'buyer' | 'producer') => {
    setIsLoading(true);
    try {
      console.log("Attempting signup with:", { email, name, role });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
            country: 'Nigeria', // Default, can be updated in profile settings
          },
        }
      });

      if (error) {
        console.error("Signup auth error:", error);
        
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          toast.error('A user with this email already exists');
        } else {
          toast.error(error.message || 'Failed to create account');
        }
        
        setIsLoading(false);
        return;
      }

      console.log("Auth signup successful:", data);
      
      if (data?.user) {
        if (data.session?.user) {
          const appUser = await loadAppUser(data.user, {
            full_name: name,
            role,
            status: 'active',
            country: 'Nigeria',
          });

          setUser(appUser);
          toast.success('Account created successfully!');
          navigate('/auth/callback');
          return;
        }

        toast.success('Account created successfully. Please verify your email, then log in.');
        navigate('/login');
      }
    } catch (error: unknown) {
      console.error('Signup error:', error);
      toast.error(getErrorMessage(error, 'Failed to create account'));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: unknown) {
      console.error('Logout error:', error);
      toast.error(getErrorMessage(error, 'Failed to logout'));
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.name,
          stage_name: data.producer_name,
          bio: data.bio,
          country: data.country,
          profile_picture: data.avatar_url,
          default_currency: data.default_currency,
          role: data.role,
        }
      });

      if (authError) {
        throw authError;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw userError || new Error('No user found');
      }

      await ensureUserProfile(userData.user);

      const profile = await updateUserProfileRecord(userData.user, {
        full_name: data.name,
        stage_name: data.producer_name,
        bio: data.bio,
        country: data.country,
        profile_picture: data.avatar_url,
        role: data.role,
      });

      setUser(toAppUser(userData.user, profile));
      
      if (data.default_currency) {
        setCurrency(data.default_currency);
      }
      
      toast.success('Profile updated successfully');
    } catch (error: unknown) {
      console.error('Profile update error:', error);
      toast.error(getErrorMessage(error, 'Failed to update profile'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    signup,
    logout,
    updateProfile,
    refreshSession
  };
};
