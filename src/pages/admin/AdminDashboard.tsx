
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeatsManagement } from "@/components/admin/BeatsManagement";
import { TaskManagement } from "@/components/admin/TaskManagement";
import { AnnouncementManagement } from "@/components/admin/AnnouncementManagement";
import PaymentAdmin from "./PaymentAdmin";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ShieldAlert, BarChart3, Wallet, Bell, ClipboardList } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Admin Dashboard | OrderSOUNDS";

    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl">
      <div className="mb-12">
        <SectionTitle 
          title="Admin Dashboard" 
          icon={<ShieldAlert className="h-6 w-6" />}
        />
        <p className="text-white/40 italic mt-2">Platform management and financial oversight.</p>
      </div>

      <div className="flex flex-col gap-10">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-3">
             <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                <BarChart3 size={20} className="text-[#9A3BDC]" />
             </div>
             <p className="text-white/40 text-[10px] font-black uppercase tracking-widest italic">Operations</p>
             <h4 className="text-white font-bold italic uppercase tracking-tighter">Unified Control</h4>
          </div>
          <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-3">
             <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                <Wallet size={20} className="text-[#9A3BDC]" />
             </div>
             <p className="text-white/40 text-[10px] font-black uppercase tracking-widest italic">Finance</p>
             <h4 className="text-white font-bold italic uppercase tracking-tighter">Payments</h4>
          </div>
          <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-3">
             <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                <Bell size={20} className="text-[#9A3BDC]" />
             </div>
             <p className="text-white/40 text-[10px] font-black uppercase tracking-widest italic">Notifications</p>
             <h4 className="text-white font-bold italic uppercase tracking-tighter">Announcements</h4>
          </div>
        </div>

        <Tabs defaultValue="beats" className="w-full space-y-8">
          <TabsList className="bg-white/[0.02] border border-white/5 p-1 rounded-2xl h-14 w-full justify-start overflow-x-auto">
            <TabsTrigger value="beats" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter gap-2">
               <ClipboardList size={16} /> Assets
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter gap-2">
               <Wallet size={16} /> Financials
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter gap-2">
               <BarChart3 size={16} /> Analytics
            </TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter gap-2">
               <Bell size={16} /> Announcements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="beats" className="outline-none">
            <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
              <div className="bg-[#030407] rounded-[2.4rem] p-8 overflow-hidden">
                <BeatsManagement />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="outline-none">
            <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
              <div className="bg-[#030407] rounded-[2.4rem] p-8 overflow-hidden">
                <PaymentAdmin />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="outline-none">
            <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
              <div className="bg-[#030407] rounded-[2.4rem] p-8 overflow-hidden">
                <TaskManagement />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="outline-none">
            <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
              <div className="bg-[#030407] rounded-[2.4rem] p-8 overflow-hidden">
                <AnnouncementManagement />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
