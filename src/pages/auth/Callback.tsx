
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { RoleSelectionDialog } from '@/components/auth/RoleSelectionDialog';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log("Auth callback: Starting simplified flow");
      
      // Safety timeout - if anything takes more than 3 seconds, go home
      const timeoutId = setTimeout(() => {
        console.log("Auth callback: Safety timeout reached, navigating to home");
        navigate('/');
      }, 3000);

      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          navigate('/login');
          return;
        }
        
        if (data?.session) {
          console.log("Auth callback: Session found, navigating to home");
          // Clear OAuth flags
          localStorage.removeItem('oauth_initiated');
          localStorage.removeItem('oauth_provider');
          localStorage.removeItem('oauth_mode');
          
          // Navigate immediately - let AuthContext handle user data loading
          clearTimeout(timeoutId);
          navigate('/');
        } else {
          console.log("Auth callback: No session found, navigating to login");
          clearTimeout(timeoutId);
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Auth callback exception:', error);
        clearTimeout(timeoutId);
        navigate('/login');
      }
    };
    
    handleAuthCallback();
  }, [navigate]);

  return (
    <MainLayout hideSidebar>
      <RoleSelectionDialog open={false} onOpenChange={() => {}} />
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        <h2 className="mt-4 text-xl">Completing sign-in...</h2>
      </div>
    </MainLayout>
  );
}
