
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BeatsManagement } from '@/components/admin/BeatsManagement';
import { ImageMigrationTool } from '@/components/admin/ImageMigrationTool';
import { TaskManagement } from '@/components/admin/TaskManagement';
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
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="beats">Beats Management</TabsTrigger>
            <TabsTrigger value="payments">Payment Management</TabsTrigger>
            <TabsTrigger value="tasks">Task Management</TabsTrigger>
            <TabsTrigger value="migration">Data Migration</TabsTrigger>
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
          
          <TabsContent value="migration">
            <ImageMigrationTool />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
