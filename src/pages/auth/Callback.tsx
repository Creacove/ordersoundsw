import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { RoleSelectionDialog } from '@/components/auth/RoleSelectionDialog';
import { Logo } from '@/components/ui/Logo';

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
          console.log("Auth callback: Session found, checking user role");
          // Clear OAuth flags
          localStorage.removeItem('oauth_initiated');
          localStorage.removeItem('oauth_provider');
          localStorage.removeItem('oauth_mode');
          
          try {
            // Get user data from the database to check role
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('role')
              .eq('id', data.session.user.id)
              .single();
            
            if (userError) {
              console.error("Error fetching user role:", userError);
              clearTimeout(timeoutId);
              navigate('/');
              return;
            }
            
            // Navigate based on role
            clearTimeout(timeoutId);
            if (userData?.role === 'producer') {
              console.log("Auth callback: Producer user, navigating to dashboard");
              navigate('/producer/dashboard');
            } else {
              console.log("Auth callback: Non-producer user, navigating to home");
              navigate('/');
            }
          } catch (error) {
            console.error("Error checking user role:", error);
            clearTimeout(timeoutId);
            navigate('/');
          }
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
        <div className="flex justify-center mb-8">
          <Logo size="mobile" />
        </div>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        <h2 className="mt-4 text-xl">Completing sign-in...</h2>
      </div>
    </MainLayout>
  );
}
