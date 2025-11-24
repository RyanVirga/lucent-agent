# Transaction Email Setup Guide

Follow these steps to get transaction email automation running.

## Step 1: Database Setup

Run the migrations to add new tables and extend existing ones:

```bash
# Using Supabase CLI (recommended)
supabase db push

# Or manually via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of supabase/migrations/20251124140000_transaction_emails.sql
# 3. Execute
```

## Step 2: Seed Email Templates

Load the placeholder email templates:

```bash
# Using Supabase CLI
supabase db seed

# Or manually via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of supabase/seed/20251124140000_transaction_email_templates.sql
# 3. Execute
```

Verify templates loaded:
```sql
SELECT key, name, side, audience_type 
FROM email_templates 
WHERE key LIKE 'listing_%' OR key LIKE 'buyer_%'
ORDER BY side, key;
```

You should see 24 templates (10 listing, 14 buying).

## Step 3: Resend Email Service Setup

1. **Sign up for Resend**
   - Go to https://resend.com
   - Create an account (free tier available)

2. **Verify your domain**
   - Add your domain (e.g., yourdomain.com)
   - Add the required DNS records (TXT, MX, etc.)
   - Wait for verification (can take a few minutes)

3. **Create API key**
   - Go to API Keys section
   - Create new API key
   - Copy the key (starts with `re_`)

4. **Test with Resend's test address** (optional, for immediate testing)
   - Before domain verification, you can use: `onboarding@resend.dev`
   - This will work but has delivery limitations

## Step 4: Configure Environment Variables

1. **Copy example file**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Fill in values**
   ```bash
   # Get from Supabase Dashboard → Project Settings → API
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # From Resend dashboard
   RESEND_API_KEY=re_xxxxx
   EMAIL_FROM_ADDRESS=tc@yourdomain.com
   EMAIL_FROM_NAME=Your TC Team

   # Generate a secure random string for cron authentication
   CRON_SECRET=$(openssl rand -base64 32)
   ```

3. **Enable dry-run mode for testing**
   ```bash
   EMAIL_DRY_RUN=true
   ```

## Step 5: Test Locally

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Create a test deal in database**
   ```sql
   INSERT INTO deals (
     team_id, 
     property_address, 
     side, 
     status,
     estimated_coe_date,
     offer_acceptance_date
   ) VALUES (
     'your-team-id',
     '123 Test St',
     'buying',
     'in_escrow',
     CURRENT_DATE + INTERVAL '30 days',
     CURRENT_DATE
   );
   ```

3. **Trigger immediate rules** (via API or directly)
   ```bash
   # Via API endpoint
   curl -X POST http://localhost:3000/api/agent/deals/[dealId]/events \
     -H "Content-Type: application/json" \
     -d '{"eventType":"status-changed","data":{"status":"in_escrow"}}'

   # Check console for "[EMAIL DRY-RUN]" logs
   ```

4. **Test daily cron manually**
   ```bash
   curl -X POST "http://localhost:3000/api/cron/transaction-emails?secret=your-cron-secret"
   ```

   Expected response:
   ```json
   {
     "success": true,
     "considered": 1,
     "sent": 0,
     "skipped": 0,
     "failed": 0,
     "duration_ms": 234,
     "timestamp": "2024-11-24T17:00:00Z"
   }
   ```

## Step 6: Test Email Sending

1. **Disable dry-run mode**
   ```bash
   EMAIL_DRY_RUN=false
   ```

2. **Add yourself as a test recipient**
   - Create a deal_party with your email
   - Or create an escrow company with your email
   - This way you'll receive the test emails

3. **Trigger emails again**
   - Use the same API calls as Step 5
   - Check your email inbox
   - Check Resend dashboard for delivery status

4. **Verify deduplication**
   - Trigger the same email again
   - Should be skipped (check logs: "Already sent")

## Step 7: Deploy to Production (Vercel)

1. **Push to repository**
   ```bash
   git add .
   git commit -m "Add transaction email automation"
   git push
   ```

2. **Set environment variables in Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env.local`
   - Important: Set `EMAIL_DRY_RUN=false` for production

3. **Deploy**
   - Vercel will automatically deploy from your main branch
   - The `vercel.json` file will configure the cron job

4. **Verify cron is configured**
   - Go to Vercel Dashboard → Your Project → Cron
   - Should see: `/api/cron/transaction-emails` scheduled for 9:00 AM daily
   - Timezone: UTC (9 AM UTC = 1 AM Pacific, adjust if needed)

5. **Adjust cron schedule if needed**
   
   Edit `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/transaction-emails",
       "schedule": "0 17 * * *"
     }]
   }
   ```
   
   Common schedules (in UTC):
   - `"0 17 * * *"` = 9:00 AM Pacific (5:00 PM UTC)
   - `"0 9 * * *"` = 1:00 AM Pacific (9:00 AM UTC)
   - `"0 0,12 * * *"` = Twice daily at midnight and noon UTC

## Step 8: Monitor & Refine

1. **Check logs in Vercel**
   - Go to Vercel Dashboard → Deployments → Latest → Functions
   - Look for `/api/cron/transaction-emails` logs

2. **Check database logs**
   ```sql
   -- Recent emails sent
   SELECT 
     tel.sent_at,
     tel.template_key,
     tel.status,
     d.property_address,
     d.side
   FROM transaction_email_log tel
   JOIN deals d ON d.id = tel.deal_id
   WHERE tel.sent_at > NOW() - INTERVAL '7 days'
   ORDER BY tel.sent_at DESC
   LIMIT 50;

   -- Failed sends
   SELECT * FROM transaction_email_log
   WHERE status = 'failed'
   AND sent_at > NOW() - INTERVAL '7 days';

   -- Alerts for email failures
   SELECT * FROM alerts
   WHERE message LIKE '%Failed to send%'
   AND is_read = false;
   ```

3. **Refine email templates**
   - Update the placeholder content in `email_templates` table
   - Add proper formatting, branding, links
   - Test with real deal data

4. **Add more rules** (if needed)
   - Edit `src/server/transactionEmailRules.ts`
   - Add new template in database
   - Deploy

## Troubleshooting

### Emails not sending

1. Check environment variables are set correctly
2. Verify Resend domain is verified
3. Check Resend dashboard for API errors
4. Look for errors in Vercel function logs
5. Check `transaction_email_log` for failed entries

### Duplicates being sent

1. Verify unique constraint exists on `transaction_email_log`
2. Check that `contextDate` is being passed correctly
3. Ensure rule isn't being called multiple times

### Wrong recipients

1. Check deal has required foreign keys set (escrow_company_id, lender_id, etc.)
2. Verify deal_parties table has correct roles and emails
3. Look for warnings in logs about missing recipients

### Cron not running

1. Check Vercel cron logs for errors
2. Verify CRON_SECRET matches between env var and endpoint
3. Test endpoint manually to ensure it works
4. Check Vercel billing (cron requires paid plan on some tiers)

## Success Checklist

- [ ] Migrations applied successfully
- [ ] Email templates seeded (24 total)
- [ ] Resend domain verified
- [ ] Environment variables configured
- [ ] Tested locally with dry-run mode
- [ ] Tested actual email sending
- [ ] Verified deduplication works
- [ ] Deployed to production
- [ ] Cron job configured and running
- [ ] Monitoring set up
- [ ] No errors in logs

## Next Enhancements

Once basic system is working:

1. **Improve email templates** - Add HTML formatting, branding, images
2. **Add email tracking** - Use Resend webhooks for open/click tracking
3. **Slack integration** - Send internal_chat messages to Slack
4. **Template UI** - Build admin interface to edit templates
5. **Email preferences** - Allow clients to opt out of certain emails
6. **A/B testing** - Test different subject lines and content
7. **More rules** - Add additional business logic as needed

See `docs/transaction-emails.md` for comprehensive documentation.

