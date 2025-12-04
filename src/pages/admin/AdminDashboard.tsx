
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BeatsManagement } from '@/components/admin/BeatsManagement';
import { ImageMigrationTool } from '@/components/admin/ImageMigrationTool';
import { TaskManagement } from '@/components/admin/TaskManagement';
import { AnnouncementManagement } from '@/components/admin/AnnouncementManagement';
import PaymentAdmin from './PaymentAdmin';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Admin Dashboard | OrderSOUNDS";
    
    // Double-check admin access
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return null; // ProtectedAdminRoute will handle the redirect
  }

  return (
    <MainLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform operations and settings</p>
        </div>
        
        <Tabs defaultValue="beats" className="w-full">
          <TabsList className="flex flex-wrap sm:grid sm:grid-cols-3 md:grid-cols-5 w-full mb-8 gap-1">
            <TabsTrigger value="beats" className="text-xs sm:text-sm flex-1 sm:flex-none">
              <span className="hidden sm:inline">Beats Management</span>
              <span className="sm:hidden">Beats</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm flex-1 sm:flex-none">
              <span className="hidden sm:inline">Payment Management</span>
              <span className="sm:hidden">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs sm:text-sm flex-1 sm:flex-none">
              <span className="hidden sm:inline">Task Management</span>
              <span className="sm:hidden">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs sm:text-sm flex-1 sm:flex-none">
              <span className="hidden sm:inline">Announcements</span>
              <span className="sm:hidden">Announce</span>
            </TabsTrigger>
            <TabsTrigger value="migration" className="text-xs sm:text-sm flex-1 sm:flex-none">
              <span className="hidden sm:inline">Data Migration</span>
              <span className="sm:hidden">Migration</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="beats">
            <BeatsManagement />
          </TabsContent>
          
          <TabsContent value="payments">
            <PaymentAdmin />
          </TabsContent>
          
          <TabsContent value="tasks">
            <TaskManagement />
          </TabsContent>
          
          <TabsContent value="announcements">
            <AnnouncementManagement />
          </TabsContent>
          
          <TabsContent value="migration">
            <ImageMigrationTool />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
