import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusCircle, Music2, ListMusic, Edit2, Trash2, Play, 
  Lock, Globe, Share2, Download, Heart, MoreHorizontal, 
  UserPlus, Search, Clock, Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePlayer } from "@/context/PlayerContext";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getUserPlaylists, createPlaylist, getPlaylistWithBeats, deletePlaylist, updatePlaylist } from "@/lib/playlistService";
import { useBeats } from "@/hooks/useBeats";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Playlist, Beat } from "@/types";
import { PlaylistCard } from "@/components/library/PlaylistCard";

export default function Playlists() {
  const { user } = useAuth();
  const { playBeat } = usePlayer();
  const { beats } = useBeats();
  const navigate = useNavigate();
  const { playlistId } = useParams<{ playlistId: string }>();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistBeats, setPlaylistBeats] = useState<Beat[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [editPlaylistName, setEditPlaylistName] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    document.title = "Playlists | Creacove";
    loadPlaylists();
  }, [user]);

  useEffect(() => {
    if (playlistId && playlists.length > 0) {
      const playlist = playlists.find(p => p.id === playlistId);
      if (playlist) {
        handleSelectPlaylist(playlist);
      }
    }
  }, [playlistId, playlists]);

  const loadPlaylists = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const userPlaylists = await getUserPlaylists(user.id);
    setPlaylists(userPlaylists);
    setIsLoading(false);
  };

  const handleCreatePlaylist = async () => {
    if (!user) {
      toast.error("Please log in to create playlists");
      return;
    }
    
    if (!newPlaylistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }
    
    const playlist = await createPlaylist(user.id, newPlaylistName, isPublic);
    if (playlist) {
      setPlaylists([...playlists, playlist]);
      setNewPlaylistName("");
      setIsPublic(true);
      setIsCreateDialogOpen(false);
      
      navigate(`/playlists/${playlist.id}`);
    }
  };

  const handleSelectPlaylist = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    
    const { beats } = await getPlaylistWithBeats(playlist.id);
    setPlaylistBeats(beats);
    
    if (!playlistId || playlistId !== playlist.id) {
      navigate(`/playlists/${playlist.id}`, { replace: true });
    }
  };

  const handlePlayAll = () => {
    if (playlistBeats.length === 0) return;
    
    playBeat(playlistBeats[0]);
  };

  const handleDeletePlaylist = async (id: string) => {
    const success = await deletePlaylist(id);
    if (success) {
      setPlaylists(playlists.filter(p => p.id !== id));
      
      if (selectedPlaylist && selectedPlaylist.id === id) {
        setSelectedPlaylist(null);
        setPlaylistBeats([]);
        navigate('/playlists', { replace: true });
      }
    }
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditPlaylistName(playlist.name);
    setEditIsPublic(playlist.is_public);
    setSelectedPlaylist(playlist);
    setIsEditDialogOpen(true);
  };

  const savePlaylistChanges = async () => {
    if (!selectedPlaylist) return;
    
    const updates = {
      name: editPlaylistName,
      is_public: editIsPublic
    };
    
    const success = await updatePlaylist(selectedPlaylist.id, updates);
    if (success) {
      setPlaylists(playlists.map(p => 
        p.id === selectedPlaylist.id
          ? { ...p, ...updates }
          : p
      ));
      
      if (selectedPlaylist) {
        setSelectedPlaylist({
          ...selectedPlaylist,
          ...updates
        });
      }
      
      setIsEditDialogOpen(false);
    }
  };

  const filteredPlaylists = playlists.filter(playlist => {
    if (searchQuery && !playlist.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (activeTab === "public" && !playlist.is_public) {
      return false;
    }
    if (activeTab === "private" && playlist.is_public) {
      return false;
    }
    
    return true;
  });

  const renderPlaylistsGrid = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      );
    }
    
    if (filteredPlaylists.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <ListMusic className="text-muted-foreground h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium mb-2">No playlists found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? "No playlists match your search." 
              : "You haven't created any playlists yet."}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create New Playlist
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
        {filteredPlaylists.map((playlist) => (
          <PlaylistCard 
            key={playlist.id} 
            playlist={playlist} 
            onClick={(id) => {
              const playlist = playlists.find(p => p.id === id);
              if (playlist) handleSelectPlaylist(playlist);
            }} 
            onPlay={handlePlayAll}
          />
        ))}
      </div>
    );
  };

  if (selectedPlaylist) {
    const isOwner = user && user.id === selectedPlaylist.owner_id;
    
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4"
            onClick={() => {
              setSelectedPlaylist(null);
              navigate('/playlists', { replace: true });
            }}
          >
            ← Back to playlists
          </Button>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 lg:w-1/4">
              <div className="aspect-square bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg overflow-hidden shadow-lg">
                {playlistBeats.length > 0 ? (
                  <div className="grid grid-cols-2 h-full">
                    {playlistBeats.slice(0, 4).map((beat, idx) => (
                      <div key={idx} className="relative overflow-hidden">
                        <img 
                          src={beat.cover_image_url || '/placeholder.svg'} 
                          alt={beat.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10"></div>
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - playlistBeats.length) }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="bg-black/20"></div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ListMusic size={64} className="text-white/80" />
                  </div>
                )}
              </div>
              
              <div className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {!selectedPlaylist.is_public && (
                      <Lock size={14} className="text-muted-foreground" />
                    )}
                    {selectedPlaylist.is_public && (
                      <Globe size={14} className="text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {selectedPlaylist.is_public ? 'Public playlist' : 'Private playlist'}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {playlistBeats.length} {playlistBeats.length === 1 ? 'track' : 'tracks'}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic truncate">{selectedPlaylist.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    Created by {isOwner ? 'you' : 'another user'}
                  </p>
                </div>
                
                <div className="pt-2 space-y-2">
                  <Button 
                    className="w-full gap-2"
                    onClick={handlePlayAll}
                    disabled={playlistBeats.length === 0}
                  >
                    <Play size={16} />
                    <span>Play All</span>
                  </Button>
                  
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 gap-2"
                        onClick={() => handleEditPlaylist(selectedPlaylist)}
                      >
                        <Edit2 size={16} />
                        <span>Edit</span>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="flex-1 gap-2">
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{selectedPlaylist.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full gap-2">
                        <MoreHorizontal size={16} />
                        <span>More Options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Playlist Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2">
                        <Share2 size={16} />
                        <span>Share Playlist</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" disabled={playlistBeats.length === 0}>
                        <Download size={16} />
                        <span>Download All</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Heart size={16} />
                        <span>Add to Favorites</span>
                      </DropdownMenuItem>
                      {isOwner && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2">
                            <UserPlus size={16} />
                            <span>Add Collaborators</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 bg-muted/30 flex justify-between items-center border-b border-border">
                  <h2 className="font-semibold">Tracks</h2>
                  
                  {playlistBeats.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Sort by:</span>
                      <select className="text-sm bg-transparent border-none focus:outline-none focus:ring-0">
                        <option>Recently Added</option>
                        <option>Alphabetical</option>
                        <option>Artist</option>
                      </select>
                    </div>
                  )}
                </div>
                
                {playlistBeats.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                      <Music2 className="text-muted-foreground h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No beats in this playlist yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add beats to this playlist while browsing the marketplace.
                    </p>
                    <Button asChild>
                      <a href="/">Browse Beats</a>
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] px-4 py-2 text-sm text-muted-foreground bg-muted/50">
                      <div className="w-8 text-center">#</div>
                      <div className="pl-14">Title</div>
                      <div className="hidden md:block text-right pr-8">Duration</div>
                      <div className="w-8"></div>
                    </div>
                    
                    {playlistBeats.map((beat, i) => (
                      <div 
                        key={beat.id}
                        className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] px-4 py-3 hover:bg-muted/10 items-center"
                      >
                        <div className="w-8 text-center text-muted-foreground text-sm">
                          {i + 1}
                        </div>
                        
                        <div className="flex items-center min-w-0">
                          <div className="w-10 h-10 rounded overflow-hidden mr-4 flex-shrink-0">
                            <img 
                              src={beat.cover_image_url || '/placeholder.svg'} 
                              alt={beat.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{beat.title}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {beat.producer_name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="hidden md:block text-sm text-muted-foreground text-right pr-8">
                          3:24 {/* This would typically come from the beat data */}
                        </div>
                        
                        <div className="">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => playBeat(beat)}
                          >
                            <Play size={18} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
            <DialogDescription>
              Update your playlist details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-playlist-name">Playlist Name</Label>
              <Input
                id="edit-playlist-name"
                value={editPlaylistName}
                onChange={(e) => setEditPlaylistName(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-playlist-public"
                checked={editIsPublic}
                onCheckedChange={setEditIsPublic}
              />
              <Label htmlFor="edit-playlist-public">Make this playlist public</Label>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={savePlaylistChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="container py-8">
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 rounded-xl p-4 sm:p-8 mb-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-5xl font-black text-white mb-2 tracking-tighter uppercase italic">Your Playlists</h1>
          <p className="text-white/80 mb-4 md:mb-6 text-sm md:text-base">Organize your favorite beats and share your collections with others.</p>
          
          <div className="flex flex-col xs:flex-row gap-3">
            <Button 
              className="bg-white text-purple-700 hover:bg-white/90"
              onClick={() => setIsCreateDialogOpen(true)}
              size={isMobile ? "sm" : "default"}
            >
              <PlusCircle size={isMobile ? 14 : 16} className="mr-2" />
              Create New Playlist
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              size={isMobile ? "sm" : "default"}
            >
              Browse Featured Playlists
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All Playlists</TabsTrigger>
              <TabsTrigger value="public">Public</TabsTrigger>
              <TabsTrigger value="private">Private</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search playlists..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        {renderPlaylistsGrid()}
      </div>
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Give your playlist a name and choose its visibility.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input
                id="playlist-name"
                placeholder="My Awesome Playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="playlist-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="playlist-public">Make this playlist public</Label>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreatePlaylist}>Create Playlist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

