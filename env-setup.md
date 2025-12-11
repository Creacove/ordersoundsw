
# Environment Setup Instructions

## Local Development

1. Create a `.env` file in the project root (it is already excluded from git)
2. Copy the contents from `.env.example` into your `.env` file
3. Replace the placeholder values with your actual credentials

Example `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key-here
```

## Edge Function Secrets

For sensitive API keys used in Edge Functions (like Paystack), set them as secrets in the Supabase dashboard:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Set secrets for your project
supabase secrets set PAYSTACK_SECRET_KEY=your_actual_secret_key --project-ref your-project-ref
```

Or set them through the Supabase Dashboard:
1. Go to your project in the Supabase Dashboard
2. Navigate to Settings > API > Edge Functions
3. Add your secrets under "Edge Function Secrets"

## Important Security Notes

- Never commit `.env` files or any file containing actual credentials to version control
- Use environment variables for all sensitive configuration
- For production, set environment variables through your hosting platform
