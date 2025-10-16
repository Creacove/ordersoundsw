import { useState } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { mapSupabaseUser } from '@/lib/supabase';
import { uniqueToast } from '@/lib/toast';
import { logSessionEvent } from '@/lib/authLogger';

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
  const [tokenRefreshAttempted, setTokenRefreshAttempted] = useState(false);

  const refreshSession = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      if (tokenRefreshAttempted) {
        console.log('Token refresh already attempted, skipping to prevent loop');
        return false;
      }

      setTokenRefreshAttempted(true);
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
        
        const mappedUser = mapSupabaseUser(data.user);
        setUser(mappedUser);
        
        setConsecutiveErrors(0);
        
        return true;
      } else {
        console.log('No session data returned');
        setAuthError('[silent] No session data returned from refresh');
        await logSessionEvent('refresh_no_data');
        return false;
      }
    } catch (error: any) {
      console.error('Error refreshing session:', error);
      setAuthError(`[silent] Error in refresh session: ${error.message}`);
      await logSessionEvent('refresh_exception', { error: error.message });
      return false;
    } finally {
      setIsLoading(false);
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
      
    } catch (error: any) {
      console.error('Login error:', error);
      uniqueToast.error(error.message || 'Failed to log in');
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
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            full_name: name,
            email: email,
            role: role,
            status: 'active'
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          
          if (!profileError.message.includes('duplicate key')) {
            toast.error('Could not complete profile setup, but auth account was created');
          }
        } else {
          console.log("User profile created successfully");
          toast.success('Account created successfully!');
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) {
            console.log("Couldn't auto-login, redirecting to login page");
            toast.info("Please check your email to verify your account, then log in");
            navigate('/login');
            return;
          }
          
          if (signInData?.user) {
            console.log("Auto-login successful, redirecting to home");
            const mappedUser = mapSupabaseUser(signInData.user);
            setUser({
              ...mappedUser,
              status: 'active'
            });
            
            navigate('/');
            return;
          }
        }
        
        toast.info("Account created! Please log in to continue.");
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
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
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to logout');
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

      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingUser) {
        const { error: profileError } = await supabase
          .from('users')
          .update({
            full_name: data.name,
            stage_name: data.producer_name,
            bio: data.bio,
            country: data.country,
            profile_picture: data.avatar_url,
            role: data.role,
          })
          .eq('id', userData.user.id);

        if (profileError) {
          throw profileError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: userData.user.id,
              full_name: data.name || userData.user.user_metadata?.full_name || '',
              email: userData.user.email || '',
              role: data.role || 'buyer',
              profile_picture: data.avatar_url || userData.user.user_metadata?.avatar_url || '',
              bio: data.bio || userData.user.user_metadata?.bio || '',
              country: data.country || userData.user.user_metadata?.country || 'Nigeria',
              stage_name: data.producer_name || userData.user.user_metadata?.stage_name || '',
            }
          ]);

        if (insertError) {
          throw insertError;
        }
      }

      const { data: updatedUserData, error: updatedUserError } = await supabase.auth.getUser();
      if (updatedUserError || !updatedUserData.user) {
        throw updatedUserError || new Error('Failed to get updated user data');
      }

      const mappedUser = mapSupabaseUser(updatedUserData.user);
      setUser(mappedUser);
      
      if (data.default_currency) {
        setCurrency(data.default_currency);
      }
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
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
