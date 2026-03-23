import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Compass, Search, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/search/SearchInput";

export const GenreQuickLinks = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const popularSearchTerms = [
    "Hip Hop",
    "Afrobeat",
    "R&B",
    "Amapiano",
    "Drill",
    "Trap",
    "Dancehall",
    "Gospel",
  ];

  const genres = [
    { name: "Afrobeat", path: "/genres?genre=Afrobeat" },
    { name: "Hip Hop", path: "/genres?genre=Hip Hop" },
    { name: "R&B", path: "/genres?genre=R&B" },
    { name: "Amapiano", path: "/genres?genre=Amapiano" },
  ];

  const quickRoutes = [
    { label: "Trending now", path: "/trending" },
    { label: "New drops", path: "/new" },
    { label: "Gaming scores", path: "/gaming-soundtrack" },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="panel overflow-hidden p-5 md:p-6" onKeyDown={handleKeyPress}>
        <div className="flex flex-col gap-5">
          <div className="space-y-3">
            <span className="eyebrow">
              <Search className="h-3.5 w-3.5 text-accent" />
              Find your sound fast
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white md:text-3xl">
                Search once, move quicker.
              </h2>
              <p className="mt-2 max-w-xl text-pretty text-sm text-muted-foreground md:text-base">
                Search beats, producers, or moods from one polished entry point instead of bouncing between pages.
              </p>
            </div>
          </div>

          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearch}
            onSuggestionClick={handleSuggestionClick}
            placeholder="Search beats, producers, genres..."
            suggestions={popularSearchTerms}
            showSuggestions={true}
            className="w-full"
          />

          <div className="flex flex-wrap gap-2">
            {popularSearchTerms.map((term) => (
              <Button
                key={term}
                variant="outline"
                size="sm"
                rounded="full"
                className="bg-white/[0.03]"
                onClick={() => handleSuggestionClick(term)}
              >
                {term}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <div className="panel p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="eyebrow">
                <Compass className="h-3.5 w-3.5 text-accent" />
                Browse by genre
              </span>
              <p className="mt-3 text-sm text-muted-foreground">Jump into the scenes buyers return to most.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {genres.map((genre) => (
              <Link key={genre.name} to={genre.path}>
                <Button variant="secondary" size="sm" rounded="full">
                  {genre.name}
                </Button>
              </Link>
            ))}
            <Link to="/genres">
              <Button variant="outline" size="sm" rounded="full">
                All genres
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="panel p-5 md:p-6">
          <span className="eyebrow">
            <Waves className="h-3.5 w-3.5 text-accent" />
            Quick routes
          </span>
          <div className="mt-4 space-y-3">
            {quickRoutes.map((route) => (
              <Link
                key={route.label}
                to={route.path}
                className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
              >
                <span>{route.label}</span>
                <ArrowRight className="h-4 w-4 text-accent" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
