
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Users, UserCog, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function EmailBroadcasts() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [recipientGroup, setRecipientGroup] = useState<string>("all");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [testEmail, setTestEmail] = useState("");

    const handleSend = async (isTest: boolean = false) => {
        if (!subject || !message) {
            toast({
                title: "Validation Error",
                description: "Subject and Message are required.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('send-broadcast', {
                body: {
                    subject,
                    message,
                    recipient_group: recipientGroup,
                    test_email: isTest ? (testEmail || user?.email) : undefined
                }
            });

            if (error) throw error;

            if (data.error) throw new Error(data.error);

            toast({
                title: isTest ? "Test Email Sent" : "Broadcast Sent!",
                description: isTest
                    ? `Test sent to ${testEmail || user?.email}`
                    : `Successfully sent to ${data.count} users.`,
            });

            if (!isTest) {
                // Clear form on success broadcast
                setSubject("");
                setMessage("");
            }

        } catch (error: any) {
            toast({
                title: "Error Sending Email",
                description: error.message || "Something went wrong.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Email Newsletter</CardTitle>
                <CardDescription>Send an email broadcast to your users via Resend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Recipient Group</Label>
                    <Select value={recipientGroup} onValueChange={setRecipientGroup}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> All Users</div>
                            </SelectItem>
                            <SelectItem value="producers">
                                <div className="flex items-center"><UserCog className="w-4 h-4 mr-2" /> Producers Only</div>
                            </SelectItem>
                            <SelectItem value="buyers">
                                <div className="flex items-center"><ShoppingBag className="w-4 h-4 mr-2" /> Buyers Only</div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Subject Line</Label>
                    <Input
                        placeholder="e.g., New Features Alert! 🚀"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Message (HTML supported)</Label>
                    <Textarea
                        className="min-h-[200px] font-mono"
                        placeholder="<h1>Hello!</h1><p>We have some news...</p>"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        You can use basic HTML tags for formatting.
                    </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-between items-center border-t">
                    <div className="flex w-full sm:w-auto gap-2">
                        <Input
                            placeholder="Test email address"
                            className="w-full sm:w-[250px]"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                        />
                        <Button variant="outline" onClick={() => handleSend(true)} disabled={loading}>
                            Send Test
                        </Button>
                    </div>
                    <Button className="w-full sm:w-auto" onClick={() => handleSend(false)} disabled={loading}>
                        <Send className="w-4 h-4 mr-2" />
                        Send Broadcast
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
