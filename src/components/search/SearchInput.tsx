
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onSuggestionClick?: (suggestion: string) => void;
  placeholder?: string;
  suggestions?: string[];
  showSuggestions?: boolean;
  className?: string;
}

export function SearchInput({ 
  value, 
  onChange, 
  onSubmit,
  onSuggestionClick,
  placeholder = "Search beats, producers, genres...",
  suggestions = [],
  showSuggestions = false,
  className 
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsFocused(false);
    // If onSuggestionClick is provided, call it (this will navigate)
    // Otherwise just fill the input
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  const showSuggestionsDropdown = isFocused && showSuggestions && suggestions.length > 0 && !value;

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 transform text-muted-foreground" size={18} />
          <Input 
            type="text"
            placeholder={placeholder}
            className="h-14 border-white/10 bg-white/[0.04] pl-12 pr-12 text-sm shadow-[0_18px_40px_rgba(4,6,20,0.12)] focus-visible:ring-accent/40"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            autoComplete="off"
          />
          {value ? (
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="absolute right-2 h-8 w-8 p-0"
              onClick={() => onChange("")}
            >
              <X size={16} />
            </Button>
          ) : (
            <Button 
              type="submit"
              variant="ghost" 
              size="sm" 
              className="absolute right-2 h-8 w-8 p-0"
            >
              <Search size={16} />
            </Button>
          )}
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {showSuggestionsDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-[1.4rem] border border-white/10 bg-[#0d101b]/95 shadow-[0_24px_80px_rgba(4,6,20,0.35)] backdrop-blur-2xl">
          <div className="p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Popular searches</div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full rounded-[1rem] px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.05]"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <Search size={14} className="inline mr-2 text-muted-foreground" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
