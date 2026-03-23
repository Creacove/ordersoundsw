
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { fetchProducerBeats } from "@/services/beats";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BeatCard } from "@/components/ui/BeatCard";
import { SoundpackCard } from "@/components/marketplace/SoundpackCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Music, LayoutGrid, LayoutList, Table as LucideTable, Pencil, Trash2, Upload, Package, Filter } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BeatListItem } from "@/components/ui/BeatListItem";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCart } from "@/context/CartContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Beat } from "@/types";
import { SectionTitle } from "@/components/ui/SectionTitle";

type ViewMode = "grid" | "list" | "table";

export default function ProducerBeats() {
  const { user } = useAuth();
  const { isPurchased, isFavorite } = useBeats();
  const { isInCart } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? "list" : "grid");
  const [tabValue, setTabValue] = useState<"published" | "drafts" | "soundpacks">("published");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [producerBeats, setProducerBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundpacks, setSoundpacks] = useState<any[]>([]);
  const [soundpacksLoading, setSoundpacksLoading] = useState(true);
  const [deleteSoundpackOpen, setDeleteSoundpackOpen] = useState(false);
  const [selectedSoundpackId, setSelectedSoundpackId] = useState<string | null>(null);
  const [isDeletingSoundpack, setIsDeletingSoundpack] = useState(false);

  const loadProducerBeats = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const producerId = user.id;
      const beats = await fetchProducerBeats(producerId, true);
      setProducerBeats(beats);
    } catch (error) {
      console.error('Error loading producer beats:', error);
      toast.error('Failed to load your beats');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadProducerSoundpacks = useCallback(async () => {
    if (!user) return;
    
    setSoundpacksLoading(true);
    try {
      const { data, error } = await supabase
        .from('soundpacks')
        .select('*')
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const transformedSoundpacks = (data || []).map(sp => ({
        ...sp,
        producer_name: user.stage_name || user.full_name || 'Unknown Producer'
      }));
      
      setSoundpacks(transformedSoundpacks);
    } catch (error) {
      console.error('Error loading soundpacks:', error);
      toast.error('Failed to load your soundpacks');
    } finally {
      setSoundpacksLoading(false);
    }
  }, [user]);

  useEffect(() => {
    document.title = "My Beats | OrderSOUNDS";
    loadProducerBeats();
    loadProducerSoundpacks();
    
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [loadProducerBeats, loadProducerSoundpacks]);

  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'beats_needs_refresh' && event.newValue === 'true') {
        loadProducerBeats();
        sessionStorage.removeItem('beats_needs_refresh');
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [loadProducerBeats]);

  useEffect(() => {
    if (isMobile && viewMode === "table") {
      setViewMode("list");
    }
  }, [isMobile, viewMode]);

  const draftBeats = producerBeats.filter(beat => beat.status === 'draft');
  const publishedBeats = producerBeats.filter(beat => beat.status === 'published');
  const draftSoundpacks = soundpacks.filter(sp => !sp.published);
  const publishedSoundpacks = soundpacks.filter(sp => sp.published);

  const handleEdit = useCallback((beatId: string) => {
    navigate(`/producer/upload?edit=${beatId}`);
  }, [navigate]);

  const handleDelete = useCallback((beatId: string) => {
    setSelectedBeatId(beatId);
    setDeleteOpen(true);
  }, []);

  const handlePublish = useCallback((beatId: string) => {
    setSelectedBeatId(beatId);
    setPublishOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!selectedBeatId) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('beats')
        .delete()
        .eq('id', selectedBeatId);
      if (error) {
        throw new Error(error.message);
      }

      toast.success('Beat deleted successfully');
      await loadProducerBeats();
      sessionStorage.setItem('beats_needs_refresh', 'true');
    } catch (error) {
      console.error('Error deleting beat:', error);
      toast.error('Failed to delete beat');
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
      setSelectedBeatId(null);
    }
  };

  const confirmPublish = async () => {
    if (!selectedBeatId) return;
    try {
      setIsPublishing(true);
      const { error } = await supabase
        .from('beats')
        .update({ status: 'published' })
        .eq('id', selectedBeatId);
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success('Beat published successfully');
      setProducerBeats(prev => 
        prev.map(beat => 
          beat.id === selectedBeatId 
            ? {...beat, status: 'published'} 
            : beat
        )
      );
      sessionStorage.setItem('beats_needs_refresh', 'true');
    } catch (error) {
      console.error('Error publishing beat:', error);
      toast.error('Failed to publish beat');
    } finally {
      setIsPublishing(false);
      setPublishOpen(false);
      setSelectedBeatId(null);
    }
  };

  const handleDeleteSoundpack = useCallback((soundpackId: string) => {
    setSelectedSoundpackId(soundpackId);
    setDeleteSoundpackOpen(true);
  }, []);

  const confirmDeleteSoundpack = async () => {
    if (!selectedSoundpackId) return;
    try {
      setIsDeletingSoundpack(true);
      const { error: beatsError } = await supabase
        .from('beats')
        .delete()
        .eq('soundpack_id', selectedSoundpackId);
      
      if (beatsError) throw new Error(beatsError.message);
      
      const { error: soundpackError } = await supabase
        .from('soundpacks')
        .delete()
        .eq('id', selectedSoundpackId);
      
      if (soundpackError) throw new Error(soundpackError.message);
      
      toast.success('Soundpack deleted successfully');
      setSoundpacks(prev => prev.filter(sp => sp.id !== selectedSoundpackId));
      setProducerBeats(prev => prev.filter(beat => beat.soundpack_id !== selectedSoundpackId));
      sessionStorage.setItem('beats_needs_refresh', 'true');
    } catch (error) {
      console.error('Error deleting soundpack:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete soundpack');
    } finally {
      setIsDeletingSoundpack(false);
      setDeleteSoundpackOpen(false);
      setSelectedSoundpackId(null);
    }
  };

  const NoBeatsCard = ({ title, description, showUpload = true }: { title: string, description: string, showUpload?: boolean }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white/[0.01] rounded-[2.5rem] border border-dashed border-white/5 mx-auto max-w-2xl">
      <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
        <Music className="h-8 w-8 text-white/10" />
      </div>
      <h3 className="font-black text-white italic tracking-tighter uppercase text-xl mb-2">{title}</h3>
      <p className="text-white/30 italic px-4 mb-8">{description}</p>
      {showUpload && (
        <Button onClick={() => navigate('/producer/upload')} className="h-12 rounded-xl bg-white text-black font-black uppercase italic tracking-tighter px-8 hover:bg-white/90">
          Upload Now
        </Button>
      )}
    </div>
  );

  const showSkeleton = initialLoading || (isLoading && producerBeats.length === 0);

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <SectionTitle 
            title="My Beats & Soundpacks" 
            icon={<Music className="h-6 w-6" />}
          />
          <p className="text-white/40 italic mt-2 text-lg">Manage your music catalog and track sales.</p>
        </div>
        
        <div className="flex items-center gap-4">
           {!isMobile && (
             <div className="bg-white/[0.02] border border-white/5 p-1 rounded-2xl flex gap-1">
               <Button
                 variant="ghost"
                 size="sm"
                 className={cn("h-10 rounded-xl px-4 font-black uppercase italic tracking-tighter text-[10px]", viewMode === "grid" ? "bg-white text-black" : "text-white/40 hover:text-white")}
                 onClick={() => setViewMode("grid")}
               >
                 <LayoutGrid className="h-3.5 w-3.5 mr-2" /> Grid
               </Button>
               <Button
                 variant="ghost"
                 size="sm"
                 className={cn("h-10 rounded-xl px-4 font-black uppercase italic tracking-tighter text-[10px]", viewMode === "list" ? "bg-white text-black" : "text-white/40 hover:text-white")}
                 onClick={() => setViewMode("list")}
               >
                 <LayoutList className="h-3.5 w-3.5 mr-2" /> List
               </Button>
               <Button
                 variant="ghost"
                 size="sm"
                 className={cn("h-10 rounded-xl px-4 font-black uppercase italic tracking-tighter text-[10px]", viewMode === "table" ? "bg-white text-black" : "text-white/40 hover:text-white")}
                 onClick={() => setViewMode("table")}
               >
                 <LucideTable className="h-3.5 w-3.5 mr-2" /> Table
               </Button>
             </div>
           )}
           <Button 
             onClick={() => navigate("/producer/upload")} 
             className="h-12 rounded-xl bg-[#9A3BDC] text-white font-black uppercase italic tracking-tighter px-6 hover:bg-[#9A3BDC]/90 shadow-[0_0_20px_rgba(154,59,220,0.3)]"
           >
             <PlusCircle className="h-4 w-4 mr-2" /> Upload Beat
           </Button>
        </div>
      </div>

      <Tabs
        value={tabValue}
        onValueChange={(v) => setTabValue(v as "published" | "drafts" | "soundpacks")}
        className="w-full space-y-10"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <TabsList className="bg-transparent border-none p-0 flex gap-8">
              <TabsTrigger value="published" className="bg-transparent border-none p-0 font-black uppercase italic tracking-widest text-sm data-[state=active]:text-[#9A3BDC] data-[state=active]:bg-transparent text-white/20 transition-all gap-2 relative">
                Published {!showSkeleton && <span className="text-[10px] opacity-40">[{publishedBeats.length}]</span>}
                {tabValue === 'published' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-[#9A3BDC] rounded-full" />}
              </TabsTrigger>
              <TabsTrigger value="drafts" className="bg-transparent border-none p-0 font-black uppercase italic tracking-widest text-sm data-[state=active]:text-[#9A3BDC] data-[state=active]:bg-transparent text-white/20 transition-all gap-2 relative">
                Drafts {!showSkeleton && <span className="text-[10px] opacity-40">[{draftBeats.length}]</span>}
                {tabValue === 'drafts' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-[#9A3BDC] rounded-full" />}
              </TabsTrigger>
              <TabsTrigger value="soundpacks" className="bg-transparent border-none p-0 font-black uppercase italic tracking-widest text-sm data-[state=active]:text-[#9A3BDC] data-[state=active]:bg-transparent text-white/20 transition-all gap-2 relative">
                Soundpacks {!soundpacksLoading && <span className="text-[10px] opacity-40">[{soundpacks.length}]</span>}
                {tabValue === 'soundpacks' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-[#9A3BDC] rounded-full" />}
              </TabsTrigger>
            </TabsList>
            
            <div className="hidden md:flex items-center gap-2 text-white/20">
               <span className="text-[10px] font-black uppercase italic tracking-widest">Total Assets:</span>
               <span className="text-xs font-bold text-white italic tracking-tighter uppercase">{producerBeats.length} Tracks</span>
            </div>
        </div>

        <TabsContent value="published" className="outline-none min-h-[400px]">
          {showSkeleton ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square w-full rounded-[2rem] bg-white/[0.02]" />
                  <Skeleton className="h-4 w-2/3 bg-white/[0.02]" />
                  <Skeleton className="h-3 w-1/2 bg-white/[0.02]" />
                </div>
              ))}
            </div>
          ) : publishedBeats.length > 0 ? (
            <>
              {viewMode === "grid" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                  {publishedBeats.map((beat) => (
                    <div key={beat.id} className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <BeatCard
                        beat={beat}
                        isFavorite={isFavorite(beat.id)}
                        isInCart={isInCart(beat.id)}
                        isPurchased={isPurchased(beat.id)}
                        className="h-full border-none bg-white/[0.02] hover:bg-white/[0.04] transition-all rounded-[2rem]"
                        isProducerOwned={true}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>
              )}
              {viewMode === "list" && (
                <div className="space-y-4">
                  {publishedBeats.map((beat) => (
                      <BeatListItem
                        key={beat.id}
                        beat={beat}
                        isFavorite={isFavorite(beat.id)}
                        isInCart={isInCart(beat.id)}
                        isPurchased={isPurchased(beat.id)}
                        isProducerOwned={true}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                  ))}
                </div>
              )}
              {viewMode === "table" && !isMobile && (
                <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent overflow-hidden">
                  <div className="bg-[#030407] rounded-[2.4rem] overflow-hidden">
                    <UITable>
                      <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="w-[80px] py-6"></TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest text-[10px]">Title</TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest text-[10px]">Genre</TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest text-[10px]">BPM/Key</TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest text-[10px] text-right">Price</TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest text-[10px] text-right">Stats</TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest text-[10px] text-right px-8">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {publishedBeats.map((beat) => (
                          <TableRow
                            key={beat.id}
                            className="border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                            onClick={() => navigate(`/beat/${beat.id}`)}
                          >
                            <TableCell className="p-4 pl-6">
                              <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-white/10">
                                <img
                                  src={beat.cover_image_url || '/placeholder.svg'}
                                  alt={beat.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-black text-white italic tracking-tighter uppercase text-base">{beat.title}</TableCell>
                            <TableCell className="text-white/40 font-bold italic text-xs uppercase">{beat.genre}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                 <span className="text-white font-bold italic text-xs uppercase">{beat.bpm} BPM</span>
                                 <span className="text-[10px] text-white/30 font-black uppercase italic tracking-widest">{beat.key || "C Major"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-0.5">
                                 <span className="text-white font-bold italic text-sm">₦{(beat.basic_license_price_local || 0).toLocaleString()}</span>
                                 <span className="text-[10px] text-white/30 font-black uppercase italic tracking-widest">${(beat.basic_license_price_diaspora || 0).toLocaleString()}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                               <div className="flex flex-col items-end gap-0.5">
                                 <span className="text-white font-bold italic text-xs uppercase">{beat.plays || 0} PLAYS</span>
                                 <span className="text-[10px] text-emerald-500 font-black uppercase italic tracking-widest">{beat.purchase_count} SALES</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-8">
                              <div className="flex gap-2 items-center justify-end" onClick={e => e.stopPropagation()}>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                                  onClick={() => handleEdit(beat.id)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-10 w-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500"
                                  onClick={() => handleDelete(beat.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </UITable>
                  </div>
                </div>
              )}
            </>
          ) : (
            <NoBeatsCard
              title="No Published Beats"
              description="You haven't published any beats yet. Upload your first track to start selling."
            />
          )}
        </TabsContent>

        <TabsContent value="drafts" className="outline-none min-h-[400px]">
          {isLoading ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="space-y-4">
                   <Skeleton className="aspect-square w-full rounded-[2rem] bg-white/[0.02]" />
                   <Skeleton className="h-4 w-2/3 bg-white/[0.02]" />
                   <Skeleton className="h-3 w-1/2 bg-white/[0.02]" />
                 </div>
               ))}
             </div>
          ) : draftBeats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
               {draftBeats.map((beat) => (
                 <div key={beat.id} className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <BeatCard
                      beat={beat}
                      isFavorite={isFavorite(beat.id)}
                      isInCart={isInCart(beat.id)}
                      isPurchased={isPurchased(beat.id)}
                      className="h-full border-dashed border-white/10 bg-white/[0.01] rounded-[2rem]"
                      label="DRAFT"
                      isProducerOwned={true}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onPublish={handlePublish}
                    />
                 </div>
               ))}
            </div>
          ) : (
            <NoBeatsCard
              title="No Drafts"
              description="Your draft folder is empty. Start a new upload to save work for later."
              showUpload={true}
            />
          )}
        </TabsContent>
        
        <TabsContent value="soundpacks" className="outline-none min-h-[400px]">
          {soundpacksLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
               {[...Array(5)].map((_, i) => (
                 <Skeleton key={i} className="aspect-square w-full rounded-[2rem] bg-white/[0.02]" />
               ))}
            </div>
          ) : soundpacks.length > 0 ? (
            <div className="space-y-16">
              {publishedSoundpacks.length > 0 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <h3 className="text-sm font-black text-white/40 uppercase tracking-widest italic flex items-center gap-3">
                      <Package size={14} className="text-[#9A3BDC]" />
                      Published Soundpacks ({publishedSoundpacks.length})
                    </h3>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                    {publishedSoundpacks.map((soundpack) => (
                      <SoundpackCard 
                        key={soundpack.id}
                        soundpack={{...soundpack, published: true}}
                        showLicenseSelector={false}
                        isProducerOwned={true}
                        onDelete={() => handleDeleteSoundpack(soundpack.id)}
                        className="rounded-[2rem] bg-white/[0.02] border-none"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {draftSoundpacks.length > 0 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <h3 className="text-sm font-black text-white/40 uppercase tracking-widest italic flex items-center gap-3">
                      <Package size={14} className="text-white/20" />
                      Draft Soundpacks ({draftSoundpacks.length})
                    </h3>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                    {draftSoundpacks.map((soundpack) => (
                      <SoundpackCard 
                        key={soundpack.id}
                        soundpack={{...soundpack, published: false}}
                        showLicenseSelector={false}
                        isProducerOwned={true}
                        onDelete={() => handleDeleteSoundpack(soundpack.id)}
                        className="rounded-[2rem] bg-white/[0.01] border-dashed border-white/10"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <NoBeatsCard
              title="No Soundpacks"
              description="You haven't created any soundpacks yet. Bundle your samples and sell them as kits."
              showUpload={true}
            />
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#030407] border-white/10 text-white rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black italic uppercase tracking-tighter">Delete Beat?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 italic">
              This will permanently delete the beat from your catalog. This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'DELETING...' : 'CONFIRM DELETE'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent className="bg-[#030407] border-white/10 text-white rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black italic uppercase tracking-tighter">Publish Beat?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 italic">
              This beat will be visible to all buyers on the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-[#9A3BDC] text-white hover:bg-[#9A3BDC]/90 font-bold"
              onClick={confirmPublish}
              disabled={isPublishing}
            >
              {isPublishing ? 'PUBLISHING...' : 'PUBLISH NOW'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteSoundpackOpen} onOpenChange={setDeleteSoundpackOpen}>
        <AlertDialogContent className="bg-[#030407] border-white/10 text-white rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black italic uppercase tracking-tighter">Delete Soundpack?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 italic">
              Deleting this soundpack will also remove all associated files. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold"
              onClick={confirmDeleteSoundpack}
              disabled={isDeletingSoundpack}
            >
              {isDeletingSoundpack ? 'DELETING...' : 'CONFIRM DELETE'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
