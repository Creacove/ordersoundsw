
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface ProducerSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function ProducerSearch({ searchQuery, setSearchQuery }: ProducerSearchProps) {
  return (
    <div className="relative mb-12 group max-w-2xl mx-auto">
      <div className="absolute -inset-1 bg-gradient-to-r from-[#9A3BDC] to-purple-600 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
      <div className="relative">
        <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-[#9A3BDC] transition-colors">
          <Search className="h-5 w-5" />
        </div>
        <Input
          type="text"
          placeholder="Search node identifier or biography..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-14 pr-12 py-7 bg-white/[0.03] border-white/5 text-white placeholder:text-white/20 focus:ring-1 focus:ring-[#9A3BDC]/50 focus:border-[#9A3BDC]/30 w-full rounded-2xl text-lg italic font-medium backdrop-blur-xl transition-all shadow-2xl"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-5 top-1/2 transform -translate-y-1/2 text-white/20 hover:text-white transition-colors"
          >
            <div className="bg-white/5 p-1.5 rounded-lg border border-white/10 hover:bg-white/10">
              <X className="h-4 w-4" />
            </div>
          </button>
        )}
      </div>
      <div className="absolute -bottom-6 left-6 text-[8px] font-black uppercase tracking-[0.2em] text-white/10 italic">
        Real-time Directory Query Active
      </div>
    </div>
  );
}
