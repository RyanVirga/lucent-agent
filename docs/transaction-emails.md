# Transaction Email Automation

Automated email system for real estate transaction coordination. Sends timely emails based on deal status, key dates, and events.

## Overview

The transaction email automation system coordinates communication throughout the escrow process by:

- Sending immediate emails when deals enter escrow or events occur
- Running daily checks for date-based reminders and updates
- Preventing duplicate sends with deduplication logic
- Supporting both listing and buying side workflows
- Logging all communications for audit trail

## Architecture

### Components

1. **Email Templates** (`email_templates` table)
   - Handlebars templates with placeholders
   - Audience targeting (escrow, lender, agents, parties, internal)
   - Side-specific (listing/buying) or shared

2. **Email Sender** (`src/server/transactionEmails.ts`)
   - Core sending logic with deduplication
   - Recipient resolution
   - Template rendering
   - Error handling and alerts

3. **Rule Engine** (`src/server/transactionEmailRules.ts`)
   - Immediate rules (status changes, events)
   - Daily rules (date-based reminders)
   - Business logic for when to send

4. **Cron Job** (`src/app/api/cron/transaction-emails/route.ts`)
   - Daily scheduler
   - Called by hosting provider (Vercel Cron)
   - Authenticated with CRON_SECRET

5. **Infrastructure**
   - Template renderer with Handlebars helpers
   - Resend email service integration
   - Pacific timezone date utilities
   - Recipient resolver

### Data Flow

```
Deal Event
  ↓
Deal Events API → runImmediateEmailRulesForDeal()
  ↓
Rule checks conditions → sendTransactionEmail()
  ↓
Fetch template, resolve recipients, render, send
  ↓
Log to transaction_email_log (deduplication)
```

```
Cron Job (daily)
  ↓
runDailyEmailRules()
  ↓
Fetch active deals → runDailyRulesForDeal() for each
  ↓
Multiple rule checks → sendTransactionEmail() calls
  ↓
Return summary (considered, sent, skipped, failed)
```

## Email Templates

### Template Structure

```sql
key: 'buyer_opening_escrow_chat'
side: 'buying'
audience_type: 'internal_chat'
subject_template: 'New Buyer Escrow - {{property_address}}'
body_html: '<p>Hi Team, {{property_address}} opened...</p>'
is_active: true
```

### Available Placeholders

Deal fields (automatically available):
- `{{property_address}}` - Property address
- `{{estimated_coe_date}}` - Close of escrow date (formatted)
- `{{emd_due_date}}` - EMD deadline
- `{{seller_disclosures_due_date}}` - Disclosures deadline
- `{{buyer_investigation_due_date}}` - Inspection deadline
- `{{inspection_scheduled_at}}` - Inspection appointment
- `{{has_hoa}}` - Boolean for HOA
- `{{has_solar}}` - Boolean for solar
- `{{tc_fee_amount}}` - TC fee (formatted as currency)
- `{{tc_fee_payer}}` - Who pays TC fee
- All other deal fields...

Handlebars helpers:
- `{{formatDate date_field}}` - Format as "Nov 24, 2024"
- `{{formatDateTime datetime_field}}` - Format with time
- `{{formatCurrency amount}}` - Format as "$1,500"
- `{{uppercase text}}` - UPPERCASE
- `{{capitalize text}}` - Capitalize

Conditionals:
```handlebars
{{#if has_hoa}}
  HOA information is required.
{{else}}
  No HOA for this property.
{{/if}}
```

### Audience Types

- `escrow` - Escrow company
- `lender` - Lender/loan officer
- `listing_agent` - Listing agent
- `buying_agent` - Buying agent
- `seller` - Seller client
- `buyer` - Buyer client
- `all_parties` - All of the above (deduplicated)
- `internal_chat` - Team notification (no email, logs to timeline)

### Listing Side Templates (10)

1. `listing_opening_escrow_chat` - Internal notification
2. `listing_new_escrow_to_escrow` - Notify escrow company
3. `listing_new_escrow_timeline_all` - Send timeline to all parties
4. `listing_hoa_docs_update` - HOA documentation status
5. `listing_solar_transfer_update` - Solar transfer status
6. `listing_tc_invoice_to_escrow` - TC fee invoice
7. `listing_send_disclosures_to_buy_side` - Send disclosures
8. `listing_contingency_due_today` - Contingency deadline reminder
9. `listing_cda_to_escrow` - CDA prepared notification
10. `listing_request_utilities_seller` - Request utility info from seller

### Buying Side Templates (14)

1. `buyer_opening_escrow_chat` - Internal notification
2. `buyer_congrats_listing_side` - Congratulate listing agent
3. `buyer_timeline_all` - Send timeline to all parties
4. `buyer_inspection_scheduled_to_listing` - Notify of inspection
5. `buyer_executed_contract_to_lender` - Send contract to lender
6. `buyer_loan_appraisal_update` - Appraisal update
7. `buyer_hoa_docs_update` - HOA documentation status
8. `buyer_solar_transfer_update` - Solar transfer status
9. `buyer_tc_invoice_to_escrow` - TC fee invoice
10. `buyer_seller_disclosures_followup` - Reminder for disclosures
11. `buyer_cda_to_escrow` - CDA prepared notification
12. `buyer_upcoming_closing_update` - Closing reminder to buyer
13. `buyer_mls_reporting` - MLS status update
14. `buyer_request_utilities_from_listing` - Request utility info

## Email Rules

### Immediate Rules

Triggered by deal events (status changes, field updates):

**Opening Escrow** (status → 'in_escrow'):
- Listing: Send opening_escrow_chat, new_escrow_to_escrow, timeline_all
- Buying: Send opening_escrow_chat, congrats_listing_side, timeline_all

**Inspection Scheduled** (inspection_scheduled_at set):
- Buying: Send inspection_scheduled_to_listing

### Daily Rules

Run by cron job, check all active deals:

**HOA Docs Update**:
- Condition: has_hoa && !hoa_docs_received_at && daysSince(offer_acceptance) > 5
- Template: listing_hoa_docs_update
- Context: today

**Solar Transfer**:
- Condition: has_solar && daysSince(offer_acceptance) > 7
- Template: listing/buyer_solar_transfer_update
- Context: today

**Seller Disclosures Followup**:
- Condition: daysUntil(seller_disclosures_due_date) === 3 && !seller_disclosures_sent_at
- Template: buyer_seller_disclosures_followup
- Context: seller_disclosures_due_date

**Contingency Due Today**:
- Condition: any contingency date === today
- Template: listing_contingency_due_today
- Context: specific contingency date

**CDA Reminder**:
- Condition: daysUntil(estimated_coe_date) === 5 && !cda_sent_to_escrow_at
- Template: listing/buyer_cda_to_escrow
- Context: estimated_coe_date

**Upcoming Closing**:
- Condition: daysUntil(estimated_coe_date) === 3
- Template: buyer_upcoming_closing_update
- Context: estimated_coe_date

**Utility Requests**:
- Condition: daysUntil(estimated_coe_date) <= 5 && > 0
- Template: listing_request_utilities_seller / buyer_request_utilities_from_listing
- Context: estimated_coe_date

## Adding New Templates

1. **Insert template in database:**

```sql
INSERT INTO email_templates (
  key, 
  name, 
  subject_template, 
  body_html, 
  body_text,
  audience_type, 
  side, 
  is_active
) VALUES (
  'custom_template_key',
  'Custom Template Name',
  'Subject with {{property_address}}',
  '<p>Body with {{placeholders}}</p>',
  'Text version',
  'escrow',
  'listing',
  true
);
```

2. **Add rule in transactionEmailRules.ts:**

```typescript
async function maybeSendCustomRule(deal: Deal, today: string) {
  // Check conditions
  if (!deal.some_field || deal.some_other_field) {
    return { success: true, sent: false, skipped: true }
  }
  
  // Check timing
  const daysUntil = daysUntil(deal.target_date, today)
  if (daysUntil !== 7) {
    return { success: true, sent: false, skipped: true }
  }
  
  console.log(`[Email Rules] Sending custom rule for ${deal.id}`)
  
  return await sendTransactionEmail({
    dealId: deal.id,
    templateKey: 'custom_template_key',
    contextDate: deal.target_date,
  })
}
```

3. **Add to rule runner:**

Add to `runDailyRulesForDeal()` or `runImmediateEmailRulesForDeal()` as appropriate.

## Configuration

### Required Environment Variables

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (new)
RESEND_API_KEY=re_xxx
EMAIL_FROM_ADDRESS=tc@yourdomain.com
EMAIL_FROM_NAME="Your TC Team"

# Cron (new)
CRON_SECRET=random_secure_string_here

# Optional: Dry-run mode (logs but doesn't send)
EMAIL_DRY_RUN=true
```

### Setting Up Resend

1. Sign up at https://resend.com
2. Add and verify your domain
3. Create API key
4. Set `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS`

### Setting Up Cron (Vercel)

1. Create `vercel.json` in project root:

```json
{
  "crons": [{
    "path": "/api/cron/transaction-emails",
    "schedule": "0 9 * * *"
  }]
}
```

2. Set `CRON_SECRET` environment variable in Vercel dashboard
3. Deploy

Schedule: `0 9 * * *` = 9:00 AM daily (Pacific time)

## Deduplication

Prevents duplicate emails using `transaction_email_log` table with unique constraint:

```sql
UNIQUE (deal_id, template_key, context_date)
```

- Same template can be sent multiple times with different context_date
- Example: contingency_due_today sent once per contingency date
- Changing a date allows resending (new context_date creates new log row)

## Testing

### Dry-Run Mode

Set `EMAIL_DRY_RUN=true` to log emails without sending:

```bash
export EMAIL_DRY_RUN=true
```

Emails will be logged to console with full details.

### Manual Testing

Call cron endpoint manually:

```bash
curl -X POST http://localhost:3000/api/cron/transaction-emails?secret=your_cron_secret
```

Response:
```json
{
  "success": true,
  "considered": 5,
  "sent": 3,
  "skipped": 2,
  "failed": 0,
  "duration_ms": 1234,
  "timestamp": "2024-11-24T17:00:00Z"
}
```

### Unit Tests

Run tests:
```bash
npm test
```

See `src/server/__tests__/` for examples.

## Troubleshooting

### Emails Not Sending

1. Check environment variables:
   ```typescript
   import { getEnvInfo } from '@/server/lib/validateEnv'
   console.log(getEnvInfo())
   ```

2. Check `transaction_email_log` for previous sends
3. Check `alerts` table for failures
4. Check logs for error messages
5. Verify Resend domain is verified

### Duplicate Emails

Check `transaction_email_log` - should have UNIQUE constraint preventing duplicates.

If duplicates occur:
- Verify contextDate is being passed correctly
- Check that rule isn't being called multiple times
- Verify unique constraint exists in database

### Wrong Recipients

1. Check `audience_type` in template
2. Verify deal has required foreign keys (escrow_company_id, lender_id, etc.)
3. Check that deal_parties has correct roles and emails
4. Look for warnings in logs like "No recipients found"

### Cron Not Running

1. Verify `vercel.json` configuration
2. Check Vercel dashboard → Cron Logs
3. Verify `CRON_SECRET` is set
4. Test endpoint manually

## Monitoring

### Email Log

Query sent emails:
```sql
SELECT 
  tel.sent_at,
  tel.template_key,
  tel.status,
  tel.recipient_emails,
  d.property_address
FROM transaction_email_log tel
JOIN deals d ON d.id = tel.deal_id
WHERE tel.sent_at > NOW() - INTERVAL '7 days'
ORDER BY tel.sent_at DESC;
```

### Failed Sends

```sql
SELECT * FROM transaction_email_log
WHERE status = 'failed'
AND sent_at > NOW() - INTERVAL '7 days';
```

### Alerts

```sql
SELECT * FROM alerts
WHERE message LIKE '%Failed to send%'
AND is_read = false;
```

## Integration with Workflow Engine

The transaction email system integrates with the existing workflow engine:

- Workflow steps with `auto_action_type = 'send_email'` call `sendTransactionEmail()`
- Email templates can be used by both systems
- Both log to `email_events` and `deal_timeline_events`
- Workflow engine continues to handle task creation and field updates

Workflow email step example:
```json
{
  "action_type": "send_email",
  "template_name": "buyer_welcome",
  "audience": "buyer"
}
```

This will look up the template by key and send via the transaction email system.

## Best Practices

1. **Test in dry-run mode first** - Set `EMAIL_DRY_RUN=true` for initial deployment
2. **Monitor logs for first week** - Check for unexpected behavior
3. **Update templates gradually** - Start with placeholders, refine copy over time
4. **Use contextDate for date-based rules** - Enables proper deduplication
5. **Log extensively** - Helps debug why emails were/weren't sent
6. **Handle missing data gracefully** - Check for null dates before calculations
7. **Create alerts for failures** - Team can follow up manually

## Future Enhancements

- Email open/click tracking (Resend supports this)
- Slack/Teams integration for internal_chat
- Template editing UI
- Email scheduling (send at specific time)
- A/B testing for templates
- Email preferences per deal/client
- Unsubscribe handling
- Rich text editor for templates

