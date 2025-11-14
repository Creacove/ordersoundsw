import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ExternalLink, Home } from 'lucide-react';

const INTERNAL_ROUTES = {
  'Home': '/',
  'Library': '/library',
  'Trending': '/trending',
  'New Releases': '/new',
  'Charts': '/charts',
  'Genres': '/genres',
  'Gaming Soundtracks': '/gaming-soundtrack',
  'Producers': '/producers',
  'Collections': '/collections',
  'Invite & Earn': '/invite-and-earn',
  'Cart': '/cart',
  'Orders': '/orders',
} as const;

export function AnnouncementManagement() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('');
  const [announcementId, setAnnouncementId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [linkType, setLinkType] = useState<'none' | 'internal' | 'custom'>('none');
  const [internalRoute, setInternalRoute] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  async function fetchAnnouncement() {
    try {
      const { data, error } = await (supabase as any)
        .from('site_announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching announcement:', error);
        return;
      }

      if (data) {
        setAnnouncementId(data.id);
        setIsActive(data.is_active);
        setMessage(data.message);
        
        // Determine link type and set values
        if (data.link_url) {
          if (data.link_url.startsWith('/')) {
            setLinkType('internal');
            setInternalRoute(data.link_url);
          } else {
            setLinkType('custom');
            setCustomUrl(data.link_url);
          }
        } else {
          setLinkType('none');
        }
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function validateLinkUrl(): string | null {
    if (linkType === 'none') return null;
    
    if (linkType === 'internal') {
      if (!internalRoute) {
        toast.error('Please select an internal page');
        return undefined;
      }
      return internalRoute;
    }
    
    if (linkType === 'custom') {
      if (!customUrl.trim()) {
        toast.error('Please enter a URL');
        return undefined;
      }
      
      const trimmedUrl = customUrl.trim();
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        toast.error('External URLs must start with http:// or https://');
        return undefined;
      }
      
      return trimmedUrl;
    }
    
    return null;
  }

  async function handleSave() {
    if (!message.trim()) {
      toast.error('Please enter an announcement message');
      return;
    }

    const linkUrl = validateLinkUrl();
    if (linkUrl === undefined) return; // Validation failed

    setIsSaving(true);
    try {
      if (announcementId) {
        const { error } = await (supabase as any)
          .from('site_announcements')
          .update({
            message: message.trim(),
            is_active: isActive,
            link_url: linkUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', announcementId);

        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any)
          .from('site_announcements')
          .insert({
            message: message.trim(),
            is_active: isActive,
            link_url: linkUrl,
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        setAnnouncementId(data.id);
      }

      toast.success('Announcement saved successfully');
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      toast.error(error.message || 'Failed to save announcement');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site-Wide Announcement</CardTitle>
        <CardDescription>
          Manage the scrolling announcement banner that appears at the top of every page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="active" className="font-medium">
            {isActive ? 'Active' : 'Inactive'}
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Announcement Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g., 🎉 NEW: Complete daily tasks and earn points! Check out the Invite & Earn section now! 🎁"
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="space-y-3">
          <Label>Link Action (Optional)</Label>
          <RadioGroup value={linkType} onValueChange={(value: any) => setLinkType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none" />
              <Label htmlFor="none" className="font-normal cursor-pointer">
                No Link
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="internal" id="internal" />
              <Label htmlFor="internal" className="font-normal cursor-pointer flex items-center gap-1">
                <Home className="h-3 w-3" />
                Internal Page
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="font-normal cursor-pointer flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Custom URL
              </Label>
            </div>
          </RadioGroup>

          {linkType === 'internal' && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="internal-route">Select Page</Label>
              <Select value={internalRoute} onValueChange={setInternalRoute}>
                <SelectTrigger id="internal-route">
                  <SelectValue placeholder="Choose a page..." />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {Object.entries(INTERNAL_ROUTES).map(([label, route]) => (
                    <SelectItem key={route} value={route}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Users will navigate within the app
              </p>
            </div>
          )}

          {linkType === 'custom' && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="custom-url">External URL</Label>
              <Input
                id="custom-url"
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <p className="text-xs text-muted-foreground">
                Must start with http:// or https://. Opens in new tab.
              </p>
            </div>
          )}
        </div>

        {isActive && message.trim() && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative bg-primary/90 rounded-md overflow-hidden h-10 flex items-center">
              <div className="whitespace-nowrap text-primary-foreground font-medium text-sm px-4">
                {message.trim()}
              </div>
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}
