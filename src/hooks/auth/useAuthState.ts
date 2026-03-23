
import { useState, useEffect, useRef } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { mapSupabaseUser } from "@/lib/supabase";
import { uniqueToast } from "@/lib/toast";
import { loadAppUser } from "@/features/auth/profileService";

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

// Current app version - used for version-aware migrations
const CURRENT_APP_VERSION = '1.0.2'; // Incremented for auth recovery feature

// Get the previously stored app version
const getPreviousAppVersion = (): string | null => {
  try {
    return localStorage.getItem('app_version');
  } catch (error) {
    console.error('Error getting app version from localStorage:', error);
    return null;
  }
};

// Store the current app version
const storeCurrentAppVersion = (): void => {
  try {
    localStorage.setItem('app_version', CURRENT_APP_VERSION);
  } catch (error) {
    console.error('Error storing app version in localStorage:', error);
  }
};

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  currency: "NGN" | "USD";
  authError: string | null;
  appVersion: {
    current: string;
    previous: string | null;
    hasChanged: boolean;
  };
  consecutiveErrors: number;
}

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const maxRetries = 3;
  const retryCountRef = useRef(0);
  const hasShownErrorRef = useRef(false);

  // Track app version for migration purposes
  const previousVersion = getPreviousAppVersion();
  const [appVersion] = useState({
    current: CURRENT_APP_VERSION,
    previous: previousVersion,
    hasChanged: previousVersion !== null && previousVersion !== CURRENT_APP_VERSION
  });

  // Store the current app version after initialization
  useEffect(() => {
    storeCurrentAppVersion();
  }, []);

  // Reset consecutive errors when user is set
  useEffect(() => {
    if (user) {
      setConsecutiveErrors(0);
    }
  }, [user]);

  // Increment consecutive errors when authError is set
  useEffect(() => {
    if (authError && !authError.includes('[silent]')) {
      setConsecutiveErrors(prev => prev + 1);
    }
  }, [authError]);

  const getCurrencyFromLocalStorage = () => {
    try {
      const savedPreference = localStorage.getItem("preferred_currency") as
        | "NGN"
        | "USD"
        | null;
      return savedPreference &&
        (savedPreference === "NGN" || savedPreference === "USD")
        ? savedPreference
        : "NGN";
    } catch (error) {
      console.error("Error getting currency from localStorage:", error);
      return "NGN";
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchUserData = async (authUser: AuthUser, onSuccess: (userData: User) => void) => {
      try {
        const appUser = await loadAppUser(authUser);

        retryCountRef.current = 0;
        hasShownErrorRef.current = false;
        setAuthError(null);
        onSuccess(appUser);
      } catch (error: unknown) {
        const message = getErrorMessage(error, 'Unable to load user data');
        console.error("Error in fetchUserData:", error);

        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          console.log(`Retrying user data fetch (${retryCountRef.current}/${maxRetries})...`);
          setTimeout(() => {
            void fetchUserData(authUser, onSuccess);
          }, 2000 * retryCountRef.current);
          return;
        }

        if (!hasShownErrorRef.current) {
          uniqueToast.error("Unable to load user data. Please refresh the page.");
          hasShownErrorRef.current = true;
        }

        setAuthError(`[silent] Error fetching user data: ${message}`);
        setIsLoading(false);
      }
    };
    
    // IMPORTANT: First check for existing session to avoid flicker
    const checkSession = async () => {
      try {
        console.log("Checking for existing session");
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session check error:", error);
          if (mounted) {
            setIsLoading(false);
            setAuthError(`[silent] Session check failed: ${error.message}`);
          }
          return;
        }

        if (data?.session?.user) {
          console.log("Found existing session:", data.session.user.id);
          if (!mounted) return;
          
          const mappedUser = mapSupabaseUser(data.session.user);

          // Set the basic user immediately to avoid UI flicker
          setUser(mappedUser);
          
          // Get user data in a setTimeout to avoid deadlocks with auth state changes
          setTimeout(async () => {
            if (!mounted) return;
            
            fetchUserData(data.session.user, (appUser) => {
              if (!mounted) return;

              setUser(appUser);

              const currency = getCurrencyFromLocalStorage();
              setCurrency(currency);
              
              // Finally set loading to false
              setIsLoading(false);
            });
          }, 100); // Slightly reduced delay as we're using setTimeout for safer auth operations
        } else {
          if (mounted) {
            setIsLoading(false);
            const currency = getCurrencyFromLocalStorage();
            setCurrency(currency);
          }
        }
      } catch (error: unknown) {
        const message = getErrorMessage(error, 'Session check failed');
        console.error("Session check error:", error);
        if (mounted) {
          setIsLoading(false);
          setAuthError(`[silent] Session check error: ${message}`);
        }
      }
    };

    // IMPORTANT: Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (!mounted) return;

      if (session?.user && event !== 'SIGNED_OUT') {
        const mappedUser = mapSupabaseUser(session.user);
        
        // Set the basic user immediately to avoid UI flicker
        setUser(mappedUser);
        hasShownErrorRef.current = false;
        retryCountRef.current = 0;
        
        // Then fetch additional data after a slight delay to avoid race conditions
        setTimeout(async () => {
          if (!mounted) return;
          
          fetchUserData(session.user, (appUser) => {
            if (!mounted) return;

            setUser(appUser);
            setAuthError(null);
            
            const currency = getCurrencyFromLocalStorage();
            setCurrency(currency);
            setIsLoading(false);
          });
        }, 100);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setAuthError(null);
        setIsLoading(false);
        hasShownErrorRef.current = false;
        retryCountRef.current = 0;
        
        // Reset currency based on location for logged out users or saved preference
        const currency = getCurrencyFromLocalStorage();
        setCurrency(currency);
      }
    });

    // THEN check for existing session
    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
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
    setConsecutiveErrors,
  };
};
