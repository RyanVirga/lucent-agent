# Lucent Agent

Next generation real estate transaction coordinator backend for agents and brokerages.

## Overview

Lucent Agent is an automated Transaction Coordinator (TC) system that runs workflows, sends emails, tracks deadlines, and surfaces next steps for real estate deals. The system is designed exclusively for agents and brokerages, not clients.

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** with strict mode
- **Supabase** for database and authentication
- **Tailwind CSS** for styling
- **Resend** for email delivery (Phase 2)

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account and project
- (Phase 2) Resend API key

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy `.env.local.example` to `.env.local` and fill in your environment variables:
```bash
cp .env.local.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `RESEND_API_KEY` - Resend API key for email sending
- `EMAIL_FROM_ADDRESS` - Email address to send from (e.g., tc@yourdomain.com)
- `EMAIL_FROM_NAME` - Display name for emails (e.g., "Your TC Team")
- `CRON_SECRET` - Secret for authenticating cron endpoints
- `EMAIL_DRY_RUN` - Optional: Set to `true` to log emails without sending (testing)
- `ENABLE_WORKFLOW_CRON` - Set to `true` to enable workflow scheduler (development)
- `DEV_BYPASS_AUTH` / `DEV_BYPASS_PROFILE_ID` - Optional dev-only auth bypass; keep disabled in production

### Database Setup

1. Run the migration to create the schema:
```bash
# Using Supabase CLI
supabase db push

# Or manually apply the migration file:
# supabase/migrations/20251120000000_tc_workflows.sql
```

2. Seed default workflows and email templates:
```bash
# Using Supabase CLI
supabase db seed

# Or manually apply the seed file:
# supabase/seed/20251120000000_tc_workflow_seed.sql
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Building for Production

```bash
npm run build
npm start
```

## Architecture

### Database Schema

The system uses a multi-tenant architecture with team-scoped access:

- **Core Tables**: `teams`, `profiles`, `deals`, `deal_parties`
- **Workflow Tables**: `workflow_definitions`, `workflow_steps`, `workflow_runs`, `workflow_run_steps`
- **Task & Communication**: `deal_tasks`, `email_templates`, `email_events`, `deal_timeline_events`
- **Transaction Emails**: `transaction_email_log`, `escrow_companies`, `lenders`
- **Documents**: `doc_packets`, `doc_packet_documents` (stubbed for future)

All tables have Row Level Security (RLS) policies enforcing team isolation.

### Workflow Engine

The workflow engine automatically:
- Starts workflows when deals enter `in_escrow` status
- Schedules steps based on deal dates (COE, inspection deadline, etc.)
- Executes actions: `send_email`, `create_task`, `update_field`, `wait_for_event`
- Logs all actions to `deal_timeline_events`

See `docs/tc-engine.md` for detailed workflow engine documentation.

### API Routes

- `GET /api/agent/dashboard` - Dashboard overview with deals and tasks
- `GET /api/agent/deals/[dealId]/tc` - Full deal TC view
- `POST /api/agent/deals/[dealId]/events` - Deal event handlers (triggers immediate email rules)
- `POST /api/system/run-workflows` - Manual workflow scheduler trigger
- `POST /api/cron/transaction-emails` - Daily transaction email automation (cron job)

### UI Pages

- `/dashboard` - Agent dashboard with active deals and tasks
- `/deals/[dealId]` - Deal detail view with workflows, tasks, and timeline
- `/automations/email-templates` - Email template management

## Workflow Scheduler

The workflow scheduler runs periodically to execute due workflow steps. In production, configure one of:

1. **Vercel Cron**: Add to `vercel.json`
2. **Supabase Schedule**: Use pg_cron extension
3. **External Cron**: Use `scripts/run-workflow-cron.ts`

See `scripts/run-workflow-cron.ts` for deployment options.

## UI Design

Lucent Agent uses a light-themed, premium design system:

- **Colors**: Soft white backgrounds (`#FAFAFA`), electric blue accents (`#3B82F6`)
- **Typography**: Inter font family with clear hierarchy
- **Components**: Rounded corners (`rounded-xl`), soft shadows, airy spacing
- **Layout**: Light sidebar, white top bar, card-based content areas

Colors can be customized via `tailwind.config.ts`. See inline comments for theming guidance.

## Transaction Email Automation

Automated email system for transaction coordination. Sends emails based on deal status, key dates, and events.

### Features

- **Immediate Emails**: Sent when deals enter escrow or events occur
- **Daily Rules**: Cron job checks all active deals for date-based reminders
- **Deduplication**: Prevents duplicate sends using `transaction_email_log`
- **Template System**: Handlebars templates with placeholders for deal data
- **Audience Targeting**: Escrow, lender, agents, parties, internal chat
- **Side-Specific**: Separate workflows for listing vs buying side

### Setup

1. Configure Resend account and verify domain
2. Set required environment variables (see above)
3. Run migrations to add transaction email tables
4. Run seed script to populate email templates
5. Configure cron job (Vercel Cron recommended)

### Cron Configuration (Vercel)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/transaction-emails",
    "schedule": "0 9 * * *"
  }]
}
```

Schedule runs daily at 9:00 AM Pacific.

### Testing

Set `EMAIL_DRY_RUN=true` to log emails without sending:
```bash
export EMAIL_DRY_RUN=true
npm run dev
```

Manual cron trigger:
```bash
curl -X POST http://localhost:3000/api/cron/transaction-emails?secret=your_cron_secret
```

See `docs/transaction-emails.md` for comprehensive documentation.

## Testing

Unit tests are located in `src/server/workflows/*.test.ts` (to be implemented).

## Documentation

- `docs/assumptions.md` - Project assumptions and design decisions
- `docs/tc-engine.md` - Workflow engine architecture and lifecycle
- `docs/transaction-emails.md` - Transaction email automation system (comprehensive)
- `docs/mcp-supabase.md` - How to connect Supabase to MCP tooling (Cursor, Claude, etc.)

## License

Private - CraftAmplify

