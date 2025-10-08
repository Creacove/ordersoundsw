
import { useEffect, useState, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { fetchProducerBeats } from "@/services/beats"; // Fixed: updated import
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BeatCard } from "@/components/ui/BeatCard";
import { SoundpackCard } from "@/components/marketplace/SoundpackCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Music, LayoutGrid, LayoutList, Table as LucideTable, Pencil, Trash2, Upload, Package } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
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

  // Load producer beats directly
  const loadProducerBeats = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const producerId = user.id;
      console.log(`Loading beats for producer ${producerId}`);
      const beats = await fetchProducerBeats(producerId, true);
      setProducerBeats(beats);
    } catch (error) {
      console.error('Error loading producer beats:', error);
      toast.error('Failed to load your beats');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load producer soundpacks
  const loadProducerSoundpacks = useCallback(async () => {
    if (!user) return;
    
    setSoundpacksLoading(true);
    try {
      // Simplified query without foreign key join to avoid 400 errors
      const { data, error } = await supabase
        .from('soundpacks')
        .select('*')
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform soundpacks and add producer name from current user
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
    
    // Initial load
    loadProducerBeats();
    loadProducerSoundpacks();
    
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [loadProducerBeats, loadProducerSoundpacks]);

  // Listen for storage events to detect changes from other tabs/windows
  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'beats_needs_refresh' && event.newValue === 'true') {
        console.log("Refresh triggered from another tab/component");
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
      // Update the local beats list after deletion
      setProducerBeats(prev => prev.filter(beat => beat.id !== selectedBeatId));
      // Set flag for other components/tabs
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
      
      // Update the local beats list after publishing
      setProducerBeats(prev => 
        prev.map(beat => 
          beat.id === selectedBeatId 
            ? {...beat, status: 'published'} 
            : beat
        )
      );
      
      // Set flag for other components/tabs
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

  const NoBeatsCard = ({
    title,
    description,
    showUpload = true,
  }: {
    title: string,
    description: string,
    showUpload?: boolean
  }) => (
    <Card className="border border-dashed bg-muted/40">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-3">
          <Music className="h-7 w-7 text-primary" />
        </div>
        <h2 className="heading-responsive-sm mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-5">{description}</p>
        {showUpload && (
          <Button onClick={() => navigate('/producer/upload')} className="gap-1.5 rounded px-4" size="sm">
            <PlusCircle className="h-4 w-4" />
            Upload Beat
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const showSkeleton = initialLoading || (isLoading && producerBeats.length === 0);

  return (
    <MainLayout activeTab="beats">
      <div className={cn("container py-4 md:py-6 max-w-full px-1 md:px-3 lg:px-8", isMobile ? "pb-16" : "")}>
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between mb-4 gap-y-2 gap-x-3">
          <div className="flex items-center space-x-3 w-full">
            <h1 className="heading-responsive-lg flex-grow truncate">My Beats</h1>
            {!showSkeleton && (
              <span className="text-muted-foreground text-xs md:text-sm ml-2">
                {producerBeats.length} {producerBeats.length === 1 ? "beat" : "beats"}
              </span>
            )}
            <Button 
              onClick={() => navigate("/producer/upload")} 
              size="sm" 
              className="ml-auto flex-shrink-0 gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              Upload
            </Button>
          </div>
          {!isMobile && (
            <div className="flex gap-2 ml-4">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs p-2 h-auto"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs p-2 h-auto"
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <LayoutList className="h-4 w-4 mr-1.5" />
                List
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs p-2 h-auto"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
              >
                <LucideTable className="h-4 w-4 mr-1.5" />
                Table
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between md:gap-6 gap-2 mb-2">
          <Tabs
            value={tabValue}
            onValueChange={(v) => setTabValue(v as "published" | "drafts" | "soundpacks")}
            className="w-full"
          >
            <div className="flex justify-between items-center mb-2">
              <TabsList className="max-w-md w-full flex items-center ml-0 md:mx-0 mb-0">
                <TabsTrigger value="published" className={cn("flex-1 text-sm md:text-base py-2", tabValue === "published" ? "shadow" : "")}>
                  Published <span className="ml-1 text-xs text-muted-foreground font-normal">
                    {!showSkeleton ? `(${publishedBeats.length})` : "(...)"}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="drafts" className={cn("flex-1 text-sm md:text-base py-2", tabValue === "drafts" ? "shadow" : "")}>
                  Drafts <span className="ml-1 text-xs text-muted-foreground font-normal">
                    {!showSkeleton ? `(${draftBeats.length})` : "(...)"}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="soundpacks" className={cn("flex-1 text-sm md:text-base py-2", tabValue === "soundpacks" ? "shadow" : "")}>
                  <Package className="h-4 w-4 mr-1" />
                  Soundpacks <span className="ml-1 text-xs text-muted-foreground font-normal">
                    {!soundpacksLoading ? `(${soundpacks.length})` : "(...)"}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="published" className="mt-4 min-h-[220px] animate-fade-in">
              {showSkeleton ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="aspect-square w-full rounded-lg" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : publishedBeats.length > 0 ? (
                <>
                  {viewMode === "grid" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                      {publishedBeats.map((beat) => (
                        <div key={beat.id} className="relative group h-full">
                          <BeatCard
                            beat={beat}
                            isFavorite={isFavorite(beat.id)}
                            isInCart={isInCart(beat.id)}
                            isPurchased={isPurchased(beat.id)}
                            className="h-full shadow-sm hover:shadow-sm"
                            isProducerOwned={true}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {viewMode === "list" && (
                    <div className="space-y-2">
                      {publishedBeats.map((beat) => (
                        <div key={beat.id} className="relative group">
                          <BeatListItem
                            beat={beat}
                            isFavorite={isFavorite(beat.id)}
                            isInCart={isInCart(beat.id)}
                            isPurchased={isPurchased(beat.id)}
                            isProducerOwned={true}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {viewMode === "table" && !isMobile && (
                    <div className="rounded-md border overflow-x-auto">
                      <UITable>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]"></TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Genre</TableHead>
                            <TableHead>BPM</TableHead>
                            <TableHead>Key</TableHead>
                            <TableHead>Track Type</TableHead>
                            <TableHead className="text-right">Price (Local)</TableHead>
                            <TableHead className="text-right">Price (Diaspora)</TableHead>
                            <TableHead className="text-right">Plays</TableHead>
                            <TableHead className="text-right">Favorites</TableHead>
                            <TableHead className="text-right">Sales</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {publishedBeats.map((beat) => (
                            <TableRow
                              key={beat.id}
                              className="cursor-pointer hover:bg-muted/40"
                              onClick={() => navigate(`/beat/${beat.id}`)}
                            >
                              <TableCell className="p-2">
                                <div className="relative h-10 w-10 rounded-md overflow-hidden">
                                  <img
                                    src={beat.cover_image_url || '/placeholder.svg'}
                                    alt={beat.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{beat.title}</TableCell>
                              <TableCell>{beat.genre}</TableCell>
                              <TableCell>{beat.bpm} BPM</TableCell>
                              <TableCell>{beat.key || "-"}</TableCell>
                              <TableCell>{beat.track_type}</TableCell>
                              <TableCell className="text-right">₦{(beat.basic_license_price_local || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-right">${(beat.basic_license_price_diaspora || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-right">{beat.plays || 0}</TableCell>
                              <TableCell className="text-right">{beat.favorites_count}</TableCell>
                              <TableCell className="text-right">{beat.purchase_count}</TableCell>
                              <TableCell>
                                <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-900 text-xs font-semibold">
                                  PUBLISHED
                                </span>
                              </TableCell>
                              <TableCell className="text-right align-middle">
                                <div className="flex gap-2 items-center justify-end">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 border-0 hover:bg-purple-100"
                                    aria-label="Edit"
                                    onClick={e => { e.stopPropagation(); handleEdit(beat.id); }}
                                    style={{ color: "#fff", background: "#9b87f5" }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 border-0 hover:bg-red-100"
                                    aria-label="Delete"
                                    onClick={e => { e.stopPropagation(); handleDelete(beat.id); }}
                                    style={{ color: "#fff", background: "#ea384c" }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </UITable>
                    </div>
                  )}
                </>
              ) : (
                <NoBeatsCard
                  title="No Published Beats"
                  description="You haven't published any beats yet. Upload or publish a beat to get started!"
                />
              )}
            </TabsContent>
            <TabsContent value="drafts" className="mt-4 min-h-[220px] animate-fade-in">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="aspect-square w-full rounded-lg" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : draftBeats.length > 0 ? (
                <>
                  {viewMode === "grid" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                      {draftBeats.map((beat) => (
                        <div key={beat.id} className="relative group h-full">
                          <BeatCard
                            beat={beat}
                            isFavorite={isFavorite(beat.id)}
                            isInCart={isInCart(beat.id)}
                            isPurchased={isPurchased(beat.id)}
                            className="h-full shadow-sm hover:shadow-sm ring-2 ring-yellow-300"
                            label="DRAFT"
                            isProducerOwned={true}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onPublish={handlePublish}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {viewMode === "list" && (
                    <div className="space-y-2">
                      {draftBeats.map((beat) => (
                        <div key={beat.id} className="relative group">
                          <BeatListItem
                            beat={beat}
                            isFavorite={isFavorite(beat.id)}
                            isInCart={isInCart(beat.id)}
                            isPurchased={isPurchased(beat.id)}
                            statusLabel="DRAFT"
                            isProducerOwned={true}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onPublish={handlePublish}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {viewMode === "table" && !isMobile && (
                    <div className="rounded-md border overflow-x-auto">
                      <UITable>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]"></TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Genre</TableHead>
                            <TableHead>BPM</TableHead>
                            <TableHead>Key</TableHead>
                            <TableHead>Track Type</TableHead>
                            <TableHead className="text-right">Price (Local)</TableHead>
                            <TableHead className="text-right">Price (Diaspora)</TableHead>
                            <TableHead className="text-right">Plays</TableHead>
                            <TableHead className="text-right">Favorites</TableHead>
                            <TableHead className="text-right">Sales</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {draftBeats.map((beat) => (
                            <TableRow
                              key={beat.id}
                              className="cursor-pointer hover:bg-yellow-50"
                              onClick={() => navigate(`/beat/${beat.id}`)}
                            >
                              <TableCell className="p-2">
                                <div className="relative h-10 w-10 rounded-md overflow-hidden ring-2 ring-yellow-300">
                                  <img
                                    src={beat.cover_image_url || '/placeholder.svg'}
                                    alt={beat.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{beat.title}</TableCell>
                              <TableCell>{beat.genre}</TableCell>
                              <TableCell>{beat.bpm} BPM</TableCell>
                              <TableCell>{beat.key || "-"}</TableCell>
                              <TableCell>{beat.track_type}</TableCell>
                              <TableCell className="text-right">₦{(beat.basic_license_price_local || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-right">${(beat.basic_license_price_diaspora || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-right">{beat.plays || 0}</TableCell>
                              <TableCell className="text-right">{beat.favorites_count}</TableCell>
                              <TableCell className="text-right">{beat.purchase_count}</TableCell>
                              <TableCell>
                                <span className="inline-block px-2 py-0.5 rounded bg-yellow-200 text-yellow-900 text-xs font-semibold">
                                  DRAFT
                                </span>
                              </TableCell>
                              <TableCell className="text-right align-middle">
                                <div className="flex gap-2 items-center justify-end">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 border-0 hover:bg-green-100"
                                    aria-label="Publish"
                                    onClick={e => { e.stopPropagation(); handlePublish(beat.id); }}
                                    style={{ color: "#fff", background: "#8B5CF6" }}
                                  >
                                    <Upload className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 border-0 hover:bg-purple-100"
                                    aria-label="Edit"
                                    onClick={e => { e.stopPropagation(); handleEdit(beat.id); }}
                                    style={{ color: "#fff", background: "#9b87f5" }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 border-0 hover:bg-red-100"
                                    aria-label="Delete"
                                    onClick={e => { e.stopPropagation(); handleDelete(beat.id); }}
                                    style={{ color: "#fff", background: "#ea384c" }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </UITable>
                    </div>
                  )}
                </>
              ) : (
                <NoBeatsCard
                  title="No Drafts"
                  description="You don't have any draft beats! Upload or save a beat as draft to see them here."
                  showUpload={true}
                />
              )}
            </TabsContent>
            
            {/* Soundpacks Tab */}
            <TabsContent value="soundpacks" className="mt-4 min-h-[220px] animate-fade-in">
              {soundpacksLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="aspect-square w-full rounded-lg" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : soundpacks.length > 0 ? (
                <div className="space-y-6">
                  {/* Published Soundpacks */}
                  {publishedSoundpacks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Package size={20} />
                        Published Soundpacks ({publishedSoundpacks.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                        {publishedSoundpacks.map((soundpack) => (
                          <SoundpackCard 
                            key={soundpack.id}
                            soundpack={{...soundpack, published: true}}
                            showLicenseSelector={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Draft Soundpacks */}
                  {draftSoundpacks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Package size={20} />
                        Draft Soundpacks ({draftSoundpacks.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                        {draftSoundpacks.map((soundpack) => (
                          <SoundpackCard 
                            key={soundpack.id}
                            soundpack={{...soundpack, published: false}}
                            showLicenseSelector={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NoBeatsCard
                  title="No Soundpacks"
                  description="You haven't created any soundpacks yet. Upload a soundpack to get started!"
                  showUpload={true}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this beat?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this beat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this beat?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish this beat? It will be visible to all users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-white hover:bg-primary/90"
              onClick={confirmPublish}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publishing...' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
