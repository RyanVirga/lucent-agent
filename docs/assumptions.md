# Lucent Agent - Assumptions & Design Decisions

## Project Overview
Lucent Agent is a backend application for real estate agents and brokerages (not clients) that automates Transaction Coordination (TC) workflows. The system runs workflows, sends emails, tracks deadlines, and surfaces next steps.

## Technical Assumptions

### Stack
- **Next.js 15** with App Router
- **TypeScript** with strict mode
- **Supabase** for database and auth
- **Tailwind CSS** for styling
- **Resend** for email delivery (Phase 2)

### Database
- Multi-tenant architecture with team-scoped access
- Row Level Security (RLS) policies enforce team isolation
- No client-facing endpoints - agent/brokerage only
- Workflow engine runs server-side with service role key

### Workflow System
- Workflows are triggered when deals enter `in_escrow` status
- Workflow steps can be scheduled relative to deal dates (COE, inspection deadline, etc.)
- Steps execute actions: `send_email`, `create_task`, `update_field`, `wait_for_event`
- Email integration is deferred to Phase 2 (stubbed for now)

### UI Design
- Light theme only - bright, clean, minimal
- Premium fintech/AI assistant aesthetic
- Desktop-first responsive design
- Electric blue/cyan accents sparingly used

## Environment Variables
See `.env.local.example` for required configuration.

## Deployment
- Workflow scheduler runs via cron (Vercel cron, Supabase Schedule, or external service)
- Feature flag `ENABLE_WORKFLOW_CRON` controls local execution
- Runs every 5-15 minutes in production

