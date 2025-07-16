import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchInput } from "@/components/search/SearchInput";

const popularSearchTerms = [
  "Hip Hop", "Afrobeat", "R&B", "Amapiano", "Drill", "Trap", "Dancehall", "Gospel"
];

export const HomepageSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

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
    <section className="text-center space-y-4">
      
      <div className="max-w-2xl mx-auto">
        <div onKeyPress={handleKeyPress}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearch}
            placeholder="Search beats, producers, genres..."
            suggestions={popularSearchTerms}
            showSuggestions={true}
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
};