
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            type="text"
            placeholder={placeholder}
            className="pl-10 pr-12 py-5 h-12 bg-background border-input focus:ring-2 focus:ring-primary/20"
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
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Popular searches</div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
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
