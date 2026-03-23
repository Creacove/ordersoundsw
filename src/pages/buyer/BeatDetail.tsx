import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Pause,
  Heart,
  ShoppingCart,
  Download,
  Share2,
  ArrowLeft,
  Music,
  Tag,
  Clock3,
  Sparkles,
  ShieldCheck,
  AudioWaveform,
} from "lucide-react";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { BeatCardCompact } from "@/components/marketplace/BeatCardCompact";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/ui/PriceTag";
import { useBeats } from "@/hooks/useBeats";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCartLightweight } from "@/hooks/useCartLightweight";
import { Beat } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getLicensePrice, getAvailableLicenseTypes } from "@/utils/licenseUtils";
import { supabase } from "@/integrations/supabase/client";
import { fetchBeatById } from "@/services/beats/queryService";

const licenseCopy: Record<
  string,
  { title: string; summary: string; features: string[]; kicker?: string }
> = {
  basic: {
    title: "Starter license",
    summary: "Best for demos, writing sessions, and early release momentum.",
    features: ["MP3 delivery", "Non-commercial use", "Up to 5,000 streams"],
  },
  premium: {
    title: "Release-ready license",
    summary: "For artists ready to distribute, monetize, and push wider.",
    kicker: "Most selected",
    features: ["WAV delivery", "Commercial use", "Unlimited streams", "Broadcast-ready usage"],
  },
  exclusive: {
    title: "Ownership-forward license",
    summary: "For buyers who need the most control and the strongest rights package.",
    features: ["WAV + stems/trackouts", "Unlimited distribution", "Full broadcasting rights", "Priority exclusivity"],
  },
  custom: {
    title: "Custom terms",
    summary: "For custom rights packages, high-value campaigns, or negotiated usage.",
    features: ["Producer consultation", "Custom term sheet", "Flexible ownership structure"],
  },
};

type SimilarBeatRow = {
  id: string;
  title: string;
  producer_id: string;
  users?: {
    full_name?: string | null;
    stage_name?: string | null;
  } | null;
  cover_image?: string | null;
  audio_preview?: string | null;
  audio_file?: string | null;
  basic_license_price_local?: number | null;
  basic_license_price_diaspora?: number | null;
  premium_license_price_local?: number | null;
  premium_license_price_diaspora?: number | null;
  exclusive_license_price_local?: number | null;
  exclusive_license_price_diaspora?: number | null;
  custom_license_price_local?: number | null;
  custom_license_price_diaspora?: number | null;
  genre?: string | null;
  track_type?: string | null;
  bpm?: number | null;
  tags?: string[] | null;
  description?: string | null;
  upload_date?: string | null;
  favorites_count?: number | null;
  purchase_count?: number | null;
  status?: string | null;
};

const BeatDetail = () => {
  const { beatId } = useParams<{ beatId: string }>();
  const { toggleFavorite, isFavorite, isPurchased } = useBeats();
  const { isPlaying, currentBeat, playBeat, togglePlayPause } = usePlayer();
  const { addToCart, isInCart } = useCartLightweight();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [similarBeats, setSimilarBeats] = useState<Beat[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<string>("basic");
  const [favoritesCount, setFavoritesCount] = useState<number>(0);

  const { data: beat, isLoading, error, refetch } = useQuery({
    queryKey: ["beat", beatId],
    queryFn: async () => {
      if (!beatId) throw new Error("Beat ID is required");

      const result = await fetchBeatById(beatId);
      if (!result) throw new Error("Beat not found");

      setFavoritesCount(result.favorites_count || 0);
      return result;
    },
    enabled: !!beatId,
    staleTime: 60000,
  });

  useEffect(() => {
    if (beat) {
      document.title = `${beat.title} by ${beat.producer_name} | OrderSOUNDS`;
    }
  }, [beat]);

  useEffect(() => {
    if (beat) {
      const availableLicenses = getAvailableLicenseTypes(beat);
      setSelectedLicense(availableLicenses[0] || "basic");
    }
  }, [beat]);

  useEffect(() => {
    const fetchSimilarBeats = async () => {
      if (!beat) return;

      try {
        const BEAT_QUERY_FIELDS = `
          id,
          title,
          producer_id,
          users (
            full_name,
            stage_name
          ),
          cover_image,
          audio_preview,
          basic_license_price_local,
          basic_license_price_diaspora,
          genre,
          track_type,
          bpm,
          tags,
          upload_date,
          favorites_count,
          purchase_count,
          status,
          is_trending,
          is_weekly_pick,
          is_featured
        `;

        const { data } = await supabase
          .from("beats")
          .select(BEAT_QUERY_FIELDS)
          .eq("status", "published")
          .is("soundpack_id", null)
          .or(`producer_id.eq.${beat.producer_id},genre.eq.${beat.genre}`)
          .neq("id", beat.id)
          .limit(4);

        if (!data) return;

        const mappedBeats = (data as SimilarBeatRow[]).map((item): Beat => {
          const userData = item.users;
          const producerName = userData?.stage_name || userData?.full_name || "Unknown Producer";

          return {
            id: item.id,
            title: item.title,
            producer_id: item.producer_id,
            producer_name: producerName,
            cover_image_url: item.cover_image || "",
            preview_url: item.audio_preview || "",
            full_track_url: item.audio_file || "",
            basic_license_price_local: item.basic_license_price_local || 0,
            basic_license_price_diaspora: item.basic_license_price_diaspora || 0,
            premium_license_price_local: item.premium_license_price_local || 0,
            premium_license_price_diaspora: item.premium_license_price_diaspora || 0,
            exclusive_license_price_local: item.exclusive_license_price_local || 0,
            exclusive_license_price_diaspora: item.exclusive_license_price_diaspora || 0,
            custom_license_price_local: item.custom_license_price_local || 0,
            custom_license_price_diaspora: item.custom_license_price_diaspora || 0,
            genre: item.genre || "",
            track_type: item.track_type || "Beat",
            bpm: item.bpm || 0,
            tags: item.tags || [],
            description: item.description,
            created_at: item.upload_date || new Date().toISOString(),
            favorites_count: item.favorites_count || 0,
            purchase_count: item.purchase_count || 0,
            status: item.status === "published" ? "published" : "draft",
            is_featured: false,
          };
        });

        setSimilarBeats(mappedBeats);
      } catch (fetchError) {
        console.error("Error fetching similar beats:", fetchError);
      }
    };

    fetchSimilarBeats();
  }, [beat]);

  const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat?.id;
  const isBeatFavorite = beat ? isFavorite(beat.id) : false;
  const isBeatPurchased = beat ? isPurchased(beat.id) : false;
  const beatInCart = beat ? isInCart(beat.id) : false;

  const availableLicenseTypes = useMemo(() => (beat ? getAvailableLicenseTypes(beat) : []), [beat]);
  const selectedPlan = licenseCopy[selectedLicense] ?? licenseCopy.basic;

  const handlePlay = (similarBeat?: Beat) => {
    if (similarBeat) {
      playBeat(similarBeat);
      return;
    }

    if (beat) {
      if (isCurrentlyPlaying) {
        togglePlayPause();
      } else {
        playBeat(beat);
      }
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please log in to add favorites");
      navigate("/login");
      return;
    }

    if (!beat) return;

    try {
      const wasAdded = await toggleFavorite(beat.id);
      setFavoritesCount((prev) => (wasAdded ? prev + 1 : Math.max(0, prev - 1)));

      setTimeout(() => {
        refetch();
      }, 1500);
    } catch (toggleError) {
      console.error("Error toggling favorite:", toggleError);
      toast.error("Failed to update favorite status");
    }
  };

  const handleAddToCart = (licenseType: string) => {
    if (!beat) return;

    if (!user) {
      toast.error("Please log in to add to cart");
      navigate("/login");
      return;
    }

    if (isBeatPurchased) {
      navigate("/library");
      return;
    }

    if (isInCart(beat.id)) {
      navigate("/cart");
      return;
    }

    addToCart(beat.id, licenseType);
    toast.success(`Added "${beat.title}" (${licenseType} license) to cart`);
  };

  const handleShare = () => {
    if (navigator.share && beat) {
      navigator
        .share({
          title: `${beat.title} by ${beat.producer_name}`,
          text: `Check out this beat: ${beat.title} by ${beat.producer_name}`,
          url: window.location.href,
        })
        .catch(() => {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied to clipboard");
        });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const handleGoBack = () => {
    if (location.state && location.state.from) {
      navigate(location.state.from);
    } else {
      navigate(-1);
    }
  };

  if (error) {
    return (
      <div className="page-shell py-8">
        <div className="panel mx-auto max-w-3xl p-8 text-center">
          <span className="eyebrow">Not found</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">Beat not found</h1>
          <p className="mt-3 text-muted-foreground">
            The release you are trying to open is unavailable or no longer published.
          </p>
          <Button className="mt-6" rounded="full" onClick={() => navigate("/trending")}>
            Browse beats
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !beat) {
    return (
      <div className="relative w-full">
        <div className="page-shell py-6 md:py-12 relative z-10">
          {/* Breadcrumbs Skeleton */}
          <div className="flex items-center gap-3 mb-10">
            <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
            <Skeleton className="h-4 w-48 rounded-full bg-white/5" />
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <Skeleton className="aspect-square w-full md:w-[320px] lg:w-[380px] rounded-[2.5rem] bg-white/5" />
                <div className="flex-1 space-y-6 py-4">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-24 rounded-full bg-white/5" />
                    <Skeleton className="h-12 w-full max-w-md rounded-xl bg-white/5" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-16 rounded-full bg-white/5" />
                        <Skeleton className="h-5 w-32 rounded-full bg-white/5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="h-11 w-32 rounded-full bg-white/5" />
                    <Skeleton className="h-11 w-11 rounded-full bg-white/5" />
                    <Skeleton className="h-11 w-11 rounded-full bg-white/5" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-[2rem] bg-white/5" />
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-48 w-full rounded-[2.5rem] bg-white/5" />
                <Skeleton className="h-48 w-full rounded-[2.5rem] bg-white/5" />
              </div>
            </div>

            <aside className="space-y-6">
              <Skeleton className="h-[500px] w-full rounded-[2.5rem] bg-white/5" />
              <Skeleton className="h-32 w-full rounded-[2.5rem] bg-white/5" />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Immersive Background Decor */}
      <div className="absolute inset-0 h-[60vh] w-full overflow-hidden pointer-events-none">
        <img
          src={beat.cover_image_url || "/placeholder.svg"}
          alt=""
          className="w-full h-full object-cover opacity-20 blur-[100px] scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030407]/80 to-[#030407]" />
      </div>

      <div className="page-shell relative z-10 py-6 md:py-12">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3 text-sm font-medium">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </Button>
            <div className="flex items-center gap-2 text-white/40">
              <Link to="/trending" className="hover:text-white transition-colors">Catalog</Link>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <Link to="/genres" className="hover:text-white transition-colors">{beat.genre || "Beats"}</Link>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-white/80 line-clamp-1 max-w-[150px]">{beat.title}</span>
            </div>
          </div>
          <Badge className="bg-white/5 text-white/40 border border-white/10 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold">
            <Sparkles className="h-3 w-3 mr-2 text-accent" />
            Premium Beat
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Main Content: Hero & Experience */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Art Spotlight */}
              <div className="relative group w-full md:w-[320px] lg:w-[380px] shrink-0">
                <div className="aspect-square relative overflow-hidden rounded-[2.5rem] border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
                  <img
                    src={beat.cover_image_url || "/placeholder.svg"}
                    alt={beat.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      rounded="full"
                      className="h-20 w-20 bg-white text-black hover:bg-white/90 shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-300"
                      onClick={() => handlePlay()}
                    >
                      {isCurrentlyPlaying ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
                    </Button>
                  </div>
                </div>

                {/* Floating Action Badge */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <Badge className="bg-[#030407] border border-white/10 px-4 py-2 rounded-2xl shadow-xl backdrop-blur-xl">
                    <Music className="h-3.5 w-3.5 mr-2 text-accent" />
                    <span className="text-white/90 text-[10px] font-bold uppercase tracking-widest">{beat.track_type || "Beat"}</span>
                  </Badge>
                </div>
              </div>

              {/* Identity & Core Actions */}
              <div className="flex-1 flex flex-col justify-center py-4 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-accent/5 border-accent/20 text-accent font-bold px-3 py-0.5">
                      {beat.genre || "Afrobeat"}
                    </Badge>
                    {isBeatPurchased && <Badge className="bg-emerald-500 text-white font-bold">Ownership Locked</Badge>}
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-tight break-words max-w-full">
                    {beat.title}
                  </h1>

                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {beat.producer_profile_picture ? (
                        <img src={beat.producer_profile_picture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music className="h-5 w-5 text-white/30" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <Link
                        to={`/producer/${beat.producer_id}`}
                        className="text-lg font-bold text-white hover:text-accent transition-colors tracking-tight"
                      >
                        {beat.producer_name}
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    size="default"
                    onClick={() => handlePlay()}
                    className={cn(
                      "rounded-full h-11 px-6 font-bold text-sm transition-all duration-300 shadow-xl",
                      isCurrentlyPlaying ? "bg-white text-black" : "bg-accent text-white hover:bg-accent/90"
                    )}
                  >
                    {isCurrentlyPlaying ? <Pause className="h-4 w-4 mr-2 fill-current" /> : <Play className="h-4 w-4 mr-2 fill-current" />}
                    {isCurrentlyPlaying ? "Stop" : "Play Preview"}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-11 w-11 border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-xl"
                    onClick={handleToggleFavorite}
                  >
                    <Heart className={cn("h-5 w-5", isBeatFavorite ? "fill-accent text-accent" : "text-white/40")} />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-11 w-11 border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-xl"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 text-white/40" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Technical Specs & Details */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Energy", value: beat.bpm ? `${beat.bpm} BPM` : "Variable", icon: Clock3 },
                { label: "Key Signal", value: beat.key || "Dynamic", icon: AudioWaveform },
                { label: "Format", value: beat.track_type || "Mastered", icon: Music },
                { label: "Likes", value: favoritesCount.toLocaleString(), icon: Heart },
              ].map((spec, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:bg-white/[0.08] transition-colors group">
                  <div className="flex flex-col gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <spec.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">{spec.label}</div>
                      <div className="text-base font-bold text-white tracking-tight">{spec.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Description & Rights */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-[#030407]/40 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 space-y-4">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_#9A3BDC]" />
                  About this Beat
                </h3>
                <p className="text-white/60 text-base leading-relaxed font-medium">
                  {beat.description || "Designed for high-impact releases. This track provides a sophisticated foundation with professional-grade mixing and room for vocal exploration."}
                </p>
              </div>

              <div className="bg-[#030407]/40 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 space-y-4">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  Usage Rights
                </h3>
                <ul className="space-y-3">
                  {[
                    "Cleared for global distribution",
                    "Professional stem availability",
                    "Proof of license on checkout",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white/50 font-medium">
                      <div className="h-1 w-1 rounded-full bg-white/20" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Side Sidebar: Licensing Options */}
          <aside className="space-y-6">
            <div className="bg-[#030407]/60 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              {/* Accent glow corner */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                  <Badge className="bg-white/5 text-white/40 border border-white/10 font-bold text-[9px] uppercase tracking-[0.2em] px-3 py-1">Licensing</Badge>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Select License</h2>
                  <p className="text-sm text-white/40 font-medium">Choose a tier for your project.</p>
                </div>

                <div className="space-y-4">
                  {availableLicenseTypes.map((licenseType) => {
                    const plan = licenseCopy[licenseType] ?? licenseCopy.basic;
                    const isSelected = selectedLicense === licenseType;

                    return (
                      <button
                        key={licenseType}
                        type="button"
                        onClick={() => setSelectedLicense(licenseType)}
                        className={cn(
                          "w-full rounded-3xl border p-5 text-left transition-all duration-300 relative group",
                          isSelected
                            ? "border-accent bg-accent/5 shadow-[0_0_30px_rgba(154,59,220,0.1)]"
                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className={cn("text-base font-bold tracking-tight transition-colors", isSelected ? "text-accent" : "text-white")}>
                                {plan.title}
                              </h3>
                              {plan.kicker && (
                                <Badge className="bg-accent text-white text-[8px] font-black uppercase px-2 py-0">Hot</Badge>
                              )}
                            </div>
                            <p className="text-xs text-white/30 font-medium line-clamp-1">{plan.summary}</p>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-lg font-black tracking-tighter", isSelected ? "text-white" : "text-white/60")}>
                              ₦{getLicensePrice(beat, licenseType, false).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-accent/20 space-y-2">
                            {plan.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-[11px] text-white/60 font-medium">
                                <div className="h-1 w-1 rounded-full bg-accent" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant={isBeatPurchased ? "secondary" : "default"}
                  size="lg"
                  className={cn(
                    "w-full h-16 rounded-[1.8rem] font-black text-lg shadow-2xl transition-all active:scale-95",
                    isBeatPurchased ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-white text-black hover:bg-[#f0f0f0]"
                  )}
                  onClick={() => handleAddToCart(selectedLicense)}
                >
                  {isBeatPurchased ? (
                    <span className="flex items-center gap-2 uppercase tracking-widest"><Download className="h-5 w-5" /> In Library</span>
                  ) : beatInCart ? (
                    <span className="flex items-center gap-2 uppercase tracking-widest"><ShoppingCart className="h-5 w-5" /> View Cart</span>
                  ) : (
                    <span className="flex items-center gap-2 uppercase tracking-widest text-sm font-bold">
                      Add to Cart
                    </span>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Global Rights • Instant Delivery • WAV/MP3</p>
                </div>
              </div>
            </div>

            {/* Tags Cloud */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Discovery Tags</h4>
              <div className="flex flex-wrap gap-2">
                {(beat.tags && beat.tags.length > 0 ? beat.tags : ["Modern", "Professional", beat.genre || "Hit"]).map((tag, i) => (
                  <Badge key={i} variant="secondary" className="bg-white/5 hover:bg-white/10 text-white/60 border-none px-3 py-1 font-bold text-[10px] rounded-lg">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Similar Items Section */}
        {similarBeats.length > 0 && (
          <section className="mt-20 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
              <div>
                <Badge variant="outline" className="border-accent/40 text-accent font-black uppercase tracking-widest text-[9px] mb-3 px-3">Curated Vibes</Badge>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">More Like This</h2>
              </div>
              <Button variant="ghost" className="text-white/40 hover:text-white font-bold tracking-widest uppercase text-xs">
                See Full Catalog
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {similarBeats.map((similarBeat) => (
                <BeatCardCompact key={similarBeat.id} beat={similarBeat} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BeatDetail;
