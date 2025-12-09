
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BroadcastRequest {
    subject: string;
    message: string;
    recipient_group: 'all' | 'producers' | 'buyers';
    test_email?: string; // Optional: Send to self for testing
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const resendApiKey = Deno.env.get('RESEND_API_KEY');

        if (!resendApiKey) {
            throw new Error("Missing RESEND_API_KEY");
        }

        const resend = new Resend(resendApiKey);
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Verify User is Admin
        // Get the Authorization header from the request
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        // Get the user from the JWT
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders });
        }

        // Check if user has 'admin' role in 'users' table (or metadata)
        // Assuming 'role' column in 'users' table based on previous context
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !userProfile || userProfile.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: corsHeaders });
        }

        // 2. Parse Request
        const { subject, message, recipient_group, test_email } = await req.json() as BroadcastRequest;

        if (!subject || !message) {
            return new Response(JSON.stringify({ error: 'Subject and message are required' }), { status: 400, headers: corsHeaders });
        }

        // 3. IF Test Mode
        if (test_email) {
            // Send single email
            await resend.emails.send({
                from: 'OrderSOUNDS <newsletter@resend.dev>',
                to: [test_email],
                subject: `[TEST] ${subject}`,
                html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    ${message}
                    <hr />
                    <p style="font-size: 12px; color: #666;">This is a test broadcast sent only to you.</p>
                </div>
            `,
            });
            return new Response(JSON.stringify({ success: true, count: 1, mode: 'test' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 4. Fetch Recipients
        let query = supabase.from('users').select('email, full_name');

        if (recipient_group === 'producers') {
            query = query.eq('role', 'producer');
        } else if (recipient_group === 'buyers') {
            query = query.eq('role', 'buyer');
        }
        // else 'all' - no filter

        const { data: recipients, error: recipientsError } = await query;

        if (recipientsError) {
            throw recipientsError;
        }

        if (!recipients || recipients.length === 0) {
            return new Response(JSON.stringify({ success: true, count: 0, message: 'No recipients found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 5. Send Emails (Batching)
        // Resend supports batching, but for simplicity and safety, let's limit 
        // real batch implementation or just loop if small.
        // For "10X" robust implementation, we'll try to use Resend's batch if possible, or loop.
        // NOTE: Free tier has limits. We'll loop with a delay if needed or just fire promises.
        // Simplest approach: Map to Resend API calls.

        // Create HTML template
        const htmlTemplate = (name: string) => `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            ${message}
            <br/>
            <hr />
            <p style="font-size: 12px; color: #666;">
                You received this email because you are a member of OrderSOUNDS. 
                <a href="#">Unsubscribe</a>
            </p>
        </div>
    `;

        // Send in batches of 50 to avoid rate limits
        // Note: In a real massive system, we'd use a queue. Here we do a simple batch.
        let sentCount = 0;
        const batchSize = 20;

        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            // We can't use Resend 'batch' endpoint easily with individual customizations (names) 
            // without constructing the batch array perfectly.
            // Let's send individually in parallel for this chunk.

            await Promise.all(batch.map(async (recipient) => {
                if (!recipient.email) return;
                try {
                    await resend.emails.send({
                        from: 'OrderSOUNDS <newsletter@resend.dev>',
                        to: [recipient.email],
                        subject: subject,
                        html: htmlTemplate(recipient.full_name || 'User'),
                    });
                    sentCount++;
                } catch (e) {
                    console.error(`Failed to send to ${recipient.email}`, e);
                }
            }));
        }

        return new Response(JSON.stringify({ success: true, count: sentCount }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Broadcast error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
