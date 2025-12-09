
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
    record: {
        email: string;
        raw_user_meta_data: {
            full_name?: string;
            first_name?: string;
        };
    };
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { record } = await req.json() as WelcomeEmailRequest;

        // Safety check for email
        if (!record || !record.email) {
            console.error("No email provided in record");
            return new Response(JSON.stringify({ error: "No email provided" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        const email = record.email;
        const name = record.raw_user_meta_data?.full_name || record.raw_user_meta_data?.first_name || "Producer";

        console.log(`Sending welcome email to ${email}`);

        const { data, error } = await resend.emails.send({
            from: "OrderSOUNDS <onboarding@resend.dev>", // TODO: User needs to update this with their verified domain
            to: [email],
            subject: "Welcome to OrderSOUNDS! 🎹",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to OrderSOUNDS, ${name}!</h1>
          <p>We're thrilled to have you join our community of producers and artists.</p>
          <p>With OrderSOUNDS, you can:</p>
          <ul>
            <li>Sell your beats to a global audience (accepting both NGN and USD/USDC).</li>
            <li>Track your earnings and analytics in real-time.</li>
            <li>Connect with other talented creators.</li>
          </ul>
          <p>Head over to your <a href="https://ordersounds.com/producer/dashboard">dashboard</a> to start uploading beats.</p>
          <br/>
          <p>Best regards,</p>
          <p>The OrderSOUNDS Team</p>
        </div>
      `,
        });

        if (error) {
            console.error("Error sending email:", error);
            throw error;
        }

        console.log("Welcome email sent successfully:", data);

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Error handling request:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
