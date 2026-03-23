
import { supabase } from '@/integrations/supabase/client';

const shouldLogAuthDebug = import.meta.env.DEV;

/**
 * Lightweight auth diagnostics for local development only.
 * Production auth/session state should rely on Supabase Auth and external observability,
 * not writes from the browser into the primary application database.
 */
export const logAuthEvent = async (
  eventCategory: string,
  eventName: string,
  details: Record<string, unknown> = {},
  userId: string | null = null
) => {
  try {
    if (!shouldLogAuthDebug) {
      return;
    }

    const eventType = `${eventCategory}_${eventName}`;
    const eventTime = new Date().toISOString();
    const userIdValue = userId || 'anonymous';

    console.log('Auth event:', {
      event_type: eventType,
      user_id: userIdValue,
      details: {
        ...details,
        timestamp: eventTime,
      },
    });
  } catch (error) {
    console.error('Error in auth logging system:', error);
  }
};

/**
 * Helper method specifically for Google auth events
 */
export const logGoogleAuthEvent = async (
  event: string,
  details: Record<string, unknown> = {},
  userId: string | null = null
) => {
  return logAuthEvent('google', event, details, userId);
};

/**
 * Helper method specifically for auth callback events
 */
export const logCallbackEvent = async (
  event: string,
  details: Record<string, unknown> = {},
  userId: string | null = null
) => {
  return logAuthEvent('callback', event, details, userId);
};

/**
 * Helper method to log session-related events
 */
export const logSessionEvent = async (
  event: string,
  details: Record<string, unknown> = {},
  userId: string | null = null
) => {
  return logAuthEvent('session', event, details, userId);
};

/**
 * Force a re-authentication flow for users experiencing issues
 * @param email Optional email to pre-populate the login form
 */
export const initiateRecoveryFlow = (email?: string) => {
  try {
    // Clear any existing auth data that might be causing problems
    supabase.auth.signOut({ scope: 'local' });
    
    // Remove any OAuth-related data
    localStorage.removeItem('oauth_initiated');
    localStorage.removeItem('oauth_provider');
    localStorage.removeItem('oauth_mode');
    
    // Clear any Supabase-related error states
    localStorage.removeItem('supabase.auth.error');
    sessionStorage.removeItem('supabase.auth.error');
    
    // Log this recovery attempt
    logAuthEvent('recovery', 'initiated', { email });
    
    // Redirect to login with recovery parameter
    const loginUrl = `/login${email ? `?email=${encodeURIComponent(email)}&recovery=true` : '?recovery=true'}`;
    window.location.href = loginUrl;
  } catch (error) {
    console.error('Failed to initiate recovery flow:', error);
    // Fallback to simple redirect if something fails
    window.location.href = '/login?recovery=true';
  }
};
