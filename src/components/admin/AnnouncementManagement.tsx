import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function AnnouncementManagement() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('');
  const [announcementId, setAnnouncementId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  async function fetchAnnouncement() {
    try {
      const { data, error } = await supabase
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
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!message.trim()) {
      toast.error('Please enter an announcement message');
      return;
    }

    setIsSaving(true);
    try {
      if (announcementId) {
        const { error } = await supabase
          .from('site_announcements')
          .update({
            message: message.trim(),
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', announcementId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('site_announcements')
          .insert({
            message: message.trim(),
            is_active: isActive,
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
