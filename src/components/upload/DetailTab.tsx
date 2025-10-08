
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, Gamepad2, Music3, Package } from "lucide-react";
import { BeatDetails } from "@/hooks/useBeatUpload";

type DetailTabProps = {
  beatDetails: BeatDetails;
  handleBeatChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setBeatDetails: React.Dispatch<React.SetStateAction<BeatDetails>>;
  tags: string[];
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  handleAddTag: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleRemoveTag: (tag: string) => void;
};

const keys = [
  'Not Sure',
  'C Major', 'C Minor', 'C# Major', 'C# Minor',
  'D Major', 'D Minor', 'D# Major', 'D# Minor',
  'E Major', 'E Minor', 'F Major', 'F Minor',
  'F# Major', 'F# Minor', 'G Major', 'G Minor',
  'G# Major', 'G# Minor', 'A Major', 'A Minor',
  'A# Major', 'A# Minor', 'B Major', 'B Minor',
];

const trackTypes = [
  'Full Beat',
  'Sample Pack',
  'Beat with Hook',
  'Instrumental Loop',
  'Drum Kit',
];

export const DetailTab = ({
  beatDetails,
  handleBeatChange,
  setBeatDetails,
  tags,
  tagInput,
  setTagInput,
  handleAddTag,
  handleRemoveTag
}: DetailTabProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <ToggleGroup 
            type="single" 
            value={beatDetails.category}
            onValueChange={(value) => {
              if (value) {
                setBeatDetails({...beatDetails, category: value});
              }
            }}
            className="w-full justify-start mt-2"
          >
            <ToggleGroupItem 
              value="Music Beat" 
              className="flex items-center gap-2 flex-1 justify-center data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Music3 size={16} />
              Music Beat
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="Gaming & Soundtrack" 
              className="flex items-center gap-2 flex-1 justify-center data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Gamepad2 size={16} />
              Gaming & Soundtrack
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="Soundpack" 
              className="flex items-center gap-2 flex-1 justify-center data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Package size={16} />
              Soundpack
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div>
          <Label htmlFor="title">Beat Title *</Label>
          <Input 
            id="title" 
            name="title"
            value={beatDetails.title}
            onChange={handleBeatChange}
            placeholder="Give your beat a catchy title" 
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            name="description"
            value={beatDetails.description}
            onChange={handleBeatChange}
            placeholder="Describe your beat... What inspired you?" 
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="genre">Genre *</Label>
            <Select 
              name="genre" 
              onValueChange={(value) => setBeatDetails({...beatDetails, genre: value})}
              value={beatDetails.genre}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="afrobeat">Afrobeat</SelectItem>
                <SelectItem value="amapiano">Amapiano</SelectItem>
                <SelectItem value="hiphop">Hip Hop</SelectItem>
                <SelectItem value="rnb">R&B</SelectItem>
                <SelectItem value="pop">Pop</SelectItem>
                <SelectItem value="highlife">Highlife</SelectItem>
                <SelectItem value="dancehall">Dancehall</SelectItem>
                <SelectItem value="reggae">Reggae</SelectItem>
                <SelectItem value="trap">Trap</SelectItem>
                <SelectItem value="drill">Drill</SelectItem>
                <SelectItem value="gospel">Gospel</SelectItem>
                <SelectItem value="fuji">Fuji</SelectItem>
                <SelectItem value="juju">Juju</SelectItem>
                <SelectItem value="afrofusion">Afrofusion</SelectItem>
                <SelectItem value="edm">EDM</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
                <SelectItem value="classical">Classical</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>              
            </Select>
          </div>
          <div>
            <Label htmlFor="trackType">Track Type *</Label>
            <Select 
              name="trackType" 
              onValueChange={(value) => setBeatDetails({...beatDetails, trackType: value})}
              value={beatDetails.trackType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {trackTypes.map(type => (
                  <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, '_')}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bpm">BPM</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="bpm"
                min={40}
                max={200}
                step={1}
                defaultValue={[90]}
                value={[beatDetails.bpm]}
                onValueChange={(value) => setBeatDetails({...beatDetails, bpm: value[0]})}
                className="flex-1"
              />
              <span className="w-12 text-center font-medium">{beatDetails.bpm}</span>
            </div>
          </div>
          <div>
            <Label htmlFor="key">Key (optional)</Label>
            <Select 
              name="key" 
              onValueChange={(value) => setBeatDetails({...beatDetails, key: value})}
              value={beatDetails.key}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select key" />
              </SelectTrigger>
              <SelectContent>
                {keys.map(k => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="tags">Tags (Enter to add)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button 
                  onClick={() => handleRemoveTag(tag)} 
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
          <Input 
            id="tags" 
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add tags (e.g. afrobeat, dance)" 
          />
        </div>
      </div>
    </div>
  );
};
