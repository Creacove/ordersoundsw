
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Play, Search, Filter, ChevronRight, Music, Star, Sparkles, Library, Clock, Calendar, Tag, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function Collections() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { trendingBeats } = useBeats();
  const [activeTab, setActiveTab] = useState("featured");
  
  // Mock collections data for presentation
  const featuredCollections = [
    { 
      id: 'piano', 
      title: 'Piano Vibes', 
      description: 'Smooth piano-led beats with soul and atmosphere',
      color: 'from-blue-500 to-purple-500', 
      image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      curator: 'JUNE',
      curatorAvatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      trackCount: 18,
      featured: true,
      tags: ['Melodic', 'Piano', 'Chill'],
      date: 'Updated 3 days ago'
    },
    { 
      id: 'guitar', 
      title: 'Guitar Classics', 
      description: 'Soulful guitar-driven beats with warm tones',
      color: 'from-orange-500 to-red-500', 
      image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      curator: 'Metro Boomin',
      curatorAvatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      trackCount: 12,
      featured: true,
      tags: ['Guitar', 'Acoustic', 'Soul'],
      date: 'Updated 1 week ago'
    },
    { 
      id: 'afro', 
      title: 'Afro Fusion', 
      description: 'The perfect blend of Afrobeat rhythms and modern production',
      color: 'from-green-500 to-emerald-500', 
      image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      curator: 'DJ Eazie',
      curatorAvatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      trackCount: 24,
      featured: true,
      tags: ['Afrobeat', 'Fusion', 'Dance'],
      date: 'Updated 5 days ago'
    },
    { 
      id: 'rnb', 
      title: 'Smooth R&B', 
      description: 'Contemporary R&B beats with lush harmonies',
      color: 'from-pink-500 to-purple-500', 
      image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      curator: 'Beats by Dre',
      curatorAvatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      trackCount: 16,
      featured: true,
      tags: ['R&B', 'Smooth', 'Vocal'],
      date: 'Updated 2 days ago'
    },
  ];
  
  // Filter to featured collections only
  const onlyFeaturedCollections = featuredCollections.filter(c => c.featured);
  
  // Mood-based categories
  const moodCategories = [
    { name: "Energetic", icon: <Sparkles size={16} />, color: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" },
    { name: "Chill", icon: <Clock size={16} />, color: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" },
    { name: "Inspirational", icon: <Star size={16} />, color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400" },
    { name: "Reflective", icon: <Music size={16} />, color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
    { name: "Party", icon: <Sparkles size={16} />, color: "bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400" },
    { name: "Focus", icon: <Clock size={16} />, color: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" },
  ];

  if (collectionId) {
    const collection = featuredCollections.find(c => c.id === collectionId);
    
    if (!collection) {
      return (
        <div className="container py-20 px-4 md:px-6">
          <div className="max-w-md mx-auto p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5 text-center">
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Collection NotFound</h1>
            <p className="text-white/50 italic mb-8">This collection is not available.</p>
            <Button asChild className="w-full h-12 rounded-xl font-bold bg-white text-black hover:bg-white/90">
              <Link to="/collections">Back to Collections</Link>
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen">
        {/* Collection Header */}
        <div className={`relative h-[300px] md:h-[450px] overflow-hidden`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${collection.color} opacity-40 group-hover:scale-105 transition-transform duration-700`}></div>
          <div className="absolute inset-0 bg-[#030407]/60 backdrop-blur-[2px]"></div>
          
          <div className="container h-full flex items-end pb-12 relative z-10 px-4 md:px-6">
            <div className="max-w-3xl space-y-6">
              <div className="space-y-2">
                <Badge className="bg-[#9A3BDC] text-white border-none rounded-full px-4 py-1 font-black uppercase italic tracking-widest text-[10px]">Sonic Collection</Badge>
                <h1 className="text-2xl sm:text-4xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.9]">
                  {collection.title}
                </h1>
                <p className="text-white/70 text-lg md:text-xl italic max-w-xl">{collection.description}</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-6">
                <Button className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase italic tracking-tighter text-lg">
                  <Play size={20} className="mr-2 fill-current" /> Play Archive
                </Button>
                
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 backdrop-blur-md">
                  <Avatar className="h-8 w-8 border border-white/20">
                    <AvatarImage src={collection.curatorAvatar} alt={collection.curator} />
                    <AvatarFallback className="bg-[#1A1B1E] text-white text-[10px] font-black">{getInitials(collection.curator)}</AvatarFallback>
                  </Avatar>
                  <span className="text-white/60 text-sm font-bold uppercase tracking-widest italic">Curated by {collection.curator}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container py-12 px-4 md:px-6">
          <SectionTitle 
            title="Collection Catalog" 
            badge={`${collection.trackCount} Tracks`}
            className="mb-8"
          />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {trendingBeats.slice(0, collection.trackCount).map((beat) => (
              <BeatCard key={beat.id} beat={beat} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl">
      <div className="mb-12 space-y-4">
        <SectionTitle title="Collections" icon={<Library className="h-6 w-6" />} />
        <p className="text-white/40 italic text-lg max-w-2xl">
          Curated sound collections and playlists from our top producers.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
        {moodCategories.map((category, index) => (
          <div key={index} className="group cursor-pointer rounded-3xl bg-white/[0.02] border border-white/5 p-6 flex flex-col items-center justify-center text-center hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              {category.icon}
            </div>
            <h3 className="font-black uppercase italic tracking-tighter text-white">{category.name}</h3>
          </div>
        ))}
      </div>

      <Tabs defaultValue="featured" onValueChange={setActiveTab} className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <TabsList className="bg-white/[0.02] border border-white/5 p-1 rounded-2xl h-14 w-full md:w-auto">
            <TabsTrigger value="featured" className="flex-1 md:flex-none rounded-xl px-10 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter">Featured</TabsTrigger>
            <TabsTrigger value="all" className="flex-1 md:flex-none rounded-xl px-10 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter">All</TabsTrigger>
          </TabsList>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <Input 
              placeholder="Search collections..." 
              className="pl-12 h-14 rounded-2xl border-white/5 bg-white/[0.02] text-white placeholder:text-white/20 focus-visible:ring-white/10" 
            />
          </div>
        </div>
        
        <TabsContent value="featured" className="outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {onlyFeaturedCollections.map((collection) => (
              <Link key={collection.id} to={`/collections/${collection.id}`} className="group relative block overflow-hidden rounded-[2.5rem] p-[1px] transition-all bg-gradient-to-br from-white/10 to-transparent hover:from-[#9A3BDC]/40">
                <div className="bg-[#030407] rounded-[2.4rem] overflow-hidden">
                  <div className={`h-64 bg-gradient-to-br ${collection.color} relative opacity-40 group-hover:opacity-60 transition-opacity`}>
                     <div className="absolute inset-0 bg-[#030407]/40"></div>
                  </div>
                  
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="flex justify-between items-end gap-4">
                      <div className="space-y-2">
                        <Badge className="bg-white/10 text-white border-none rounded-full px-3 py-0.5 font-bold uppercase italic tracking-widest text-[9px] backdrop-blur-md">
                          {collection.trackCount} Tracks
                        </Badge>
                        <h3 className="text-xl sm:text-2xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-[0.9]">
                          {collection.title}
                        </h3>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="all" className="outline-none">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredCollections.map((collection) => (
              <Link key={collection.id} to={`/collections/${collection.id}`} className="group space-y-4">
                <div className={`aspect-square rounded-3xl overflow-hidden bg-gradient-to-br ${collection.color} relative p-[1px]`}>
                  <div className="absolute inset-0 bg-[#030407]/40 group-hover:bg-[#030407]/20 transition-colors"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Play className="text-white fill-white scale-150" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">{collection.title}</h3>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest italic leading-none">{collection.curator}</p>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}
