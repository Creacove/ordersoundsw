
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
import { SearchInput } from "@/components/search/SearchInput";

export const GenreQuickLinks = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const popularSearchTerms = [
    "Hip Hop", "Afrobeat", "R&B", "Amapiano", "Drill", "Trap", "Dancehall", "Gospel"
  ];

  const genres = [
    { name: "Afrobeat", path: "/genres?genre=Afrobeat" },
    { name: "Hip Hop", path: "/genres?genre=Hip Hop" },
    { name: "R&B", path: "/genres?genre=R&B" },
    { name: "Amapiano", path: "/genres?genre=Amapiano" }
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="w-full mb-12">
      {/* Search Input */}
      <div className="w-full mb-4" onKeyPress={handleKeyPress}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearch}
          placeholder="Search beats, producers, genres..."
          suggestions={popularSearchTerms}
          showSuggestions={true}
          className="w-full h-12"
        />
      </div>
      
      {/* Genre Links */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {genres.map((genre) => (
          <Link key={genre.name} to={genre.path}>
            <Button variant="outline" className="rounded-full" size="sm">
              <Music className="w-4 h-4 mr-2" />
              {genre.name}
            </Button>
          </Link>
        ))}
        <Link to="/genres">
          <Button variant="outline" className="rounded-full text-purple-500 border-purple-500 hover:bg-purple-50" size="sm">
            All genres
          </Button>
        </Link>
      </div>
    </section>
  );
};
