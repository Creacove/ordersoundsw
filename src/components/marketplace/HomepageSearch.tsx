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
    <section className="w-full">
      <div className="w-full mx-auto px-4">
        <div onKeyPress={handleKeyPress}>
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
      </div>
    </section>
  );
};