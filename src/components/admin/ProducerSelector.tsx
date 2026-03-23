
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, User, Music } from 'lucide-react';
import { ProducerSearch } from '@/components/producers/ProducerSearch';
import { useProducers } from '@/hooks/useProducers';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowerCount } from '@/components/producer/profile/FollowerCount';

interface ProducerSelectorProps {
  onSelectProducer: (producerId: string, producerName: string) => void;
  isLoading?: boolean;
  currentProducer?: {
    id: string;
    name: string;
    stageName?: string;
  } | null;
}

export function ProducerSelector({ onSelectProducer, isLoading, currentProducer }: ProducerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { producers, isLoading: producersLoading } = useProducers();

  // Filter producers based on search query
  const filteredProducers = producers.filter(producer => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      producer.full_name?.toLowerCase().includes(query) ||
      producer.stage_name?.toLowerCase().includes(query)
    );
  });

  const handleSelectProducer = (producer: any) => {
    const producerName = producer.stage_name || producer.full_name;
    onSelectProducer(producer.id, producerName);
    setIsOpen(false);
    setSearchQuery(''); // Reset search
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          Select Producer
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Producer of the Week
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search Section */}
          <div className="mb-4">
            <ProducerSearch 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
            />
          </div>

          {/* Current Producer Display */}
          {currentProducer && (
            <div className="mb-4 p-3 -purple- border -purple- rounded-lg">
              <p className="text-sm font-medium -purple- mb-1">
                Current Producer of the Week:
              </p>
              <p className="-purple-">
                {currentProducer.stageName || currentProducer.name}
              </p>
            </div>
          )}
          
          {/* Producers List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {producersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredProducers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No producers found
                </h3>
                <p className="text-gray-500">
                  {searchQuery.trim() 
                    ? `No producers match "${searchQuery}"`
                    : "No producers available"
                  }
                </p>
              </div>
            ) : (
              filteredProducers.map((producer) => (
                <div
                  key={producer.id}
                  onClick={() => handleSelectProducer(producer)}
                  className="flex items-center p-3 bg-white border rounded-lg hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors"
                >
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage 
                      src={producer.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.full_name}`}
                      alt={producer.stage_name || producer.full_name} 
                    />
                    <AvatarFallback>
                      {(producer.stage_name || producer.full_name || 'P').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {producer.stage_name || producer.full_name}
                      </h3>
                      {currentProducer?.id === producer.id && (
                        <Badge variant="secondary" className="-purple- -purple-">
                          Current
                        </Badge>
                      )}
                      {searchQuery && (
                        (producer.stage_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         producer.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) && (
                        <Badge variant="outline" className="text-xs">Match</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        {producer.beatCount} {producer.beatCount === 1 ? 'beat' : 'beats'}
                      </span>
                      <FollowerCount 
                        count={producer.follower_count || 0} 
                        className="text-sm text-gray-500"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="ml-2"
                  >
                    Select
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
