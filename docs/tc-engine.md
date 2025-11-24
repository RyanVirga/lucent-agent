# TC Workflow Engine Architecture

## Overview

The Transaction Coordinator (TC) workflow engine automates real estate deal coordination by executing predefined workflows when deals enter escrow. Workflows consist of steps that execute actions like sending emails, creating tasks, updating fields, or waiting for events.

## Schema Overview

### Workflow Definitions

Reusable workflow templates that define the sequence of steps for buying or listing side deals:

- `workflow_definitions` - Template metadata (name, side, trigger type)
- `workflow_steps` - Individual steps with scheduling and action configuration

### Workflow Execution

When a deal enters escrow, workflows are instantiated:

- `workflow_runs` - Instance of a workflow attached to a deal
- `workflow_run_steps` - Execution state of each step with scheduled dates

### Actions

Workflow steps can execute four types of actions:

1. **send_email** - Send templated email (Phase 2 - currently stubbed)
2. **create_task** - Create agent action item
3. **update_field** - Update deal field
4. **wait_for_event** - Pause until deal event occurs

## Engine Lifecycle

### 1. Workflow Instantiation

When a deal status changes to `in_escrow`:

1. Engine finds matching workflow definitions by `side` and `trigger_type`
2. Creates `workflow_runs` record for each matching workflow
3. Creates `workflow_run_steps` for each step in the workflow
4. Calculates `scheduled_for` dates based on `relative_to` and `offset_days`

**Date Calculation:**
- `relative_to`: `coe_date`, `inspection_deadline`, `deal_created`
- `offset_days`: Days before/after the relative date (negative = before, positive = after)

### 2. Step Execution

The scheduler (`runDueWorkflowSteps`) runs periodically:

1. Queries `workflow_run_steps` where `status = 'pending'` and `scheduled_for <= now`
2. For each due step:
   - Parses `auto_config` JSONB into typed config
   - Executes action based on `auto_action_type`
   - Updates step status to `completed` or `error`
   - Logs to `deal_timeline_events`

### 3. Event Handling

When deal events occur (via API `/api/agent/deals/[dealId]/events`):

1. Updates deal fields based on event type
2. Finds `wait_for_event` steps waiting for this event
3. Recalculates `scheduled_for` dates for those steps
4. Steps become eligible for execution on next scheduler run

**Event Types:**
- `set-emd-received` → waits for `emd_received` event
- `mark-inspection-contingency-removed` → waits for `inspection_contingency_removed` event
- `set-inspection-deadline` → updates `inspection_deadline` field
- `set-coe-date` → updates `coe_date` field
- `status-changed` → updates deal status, triggers workflow start if entering escrow

## Adding New Workflow Definitions

### 1. Create Workflow Definition

```sql
INSERT INTO workflow_definitions (name, description, side, trigger_type, is_active)
VALUES ('Custom Workflow', 'Description', 'buying', 'in_escrow', true);
```

### 2. Add Workflow Steps

```sql
INSERT INTO workflow_steps (
  workflow_definition_id,
  step_order,
  name,
  relative_to,
  offset_days,
  auto_action_type,
  auto_config
) VALUES (
  'workflow-definition-id',
  1,
  'Step Name',
  'coe_date',
  -7,
  'send_email',
  '{"template_name": "template_name", "audience": "buyer"}'::jsonb
);
```

### 3. Create Email Templates (if needed)

```sql
INSERT INTO email_templates (name, subject, body_html, body_text, audience)
VALUES (
  'template_name',
  'Subject with {{placeholder}}',
  '<html>Body with {{placeholder}}</html>',
  'Text body with {{placeholder}}',
  'buyer'
);
```

## Workflow Step Configuration

### Send Email Action

```json
{
  "action_type": "send_email",
  "template_name": "buyer_welcome",
  "audience": "buyer"
}
```

### Create Task Action

```json
{
  "action_type": "create_task",
  "title": "Task Title",
  "description": "Optional description",
  "due_date_offset_days": 3
}
```

### Update Field Action

```json
{
  "action_type": "update_field",
  "field": "status",
  "value": "pending_coe"
}
```

### Wait for Event Action

```json
{
  "action_type": "wait_for_event",
  "event_type": "emd_received"
}
```

## Scheduler Configuration

The workflow scheduler should run every 5-15 minutes in production:

**Vercel Cron:**
```json
{
  "crons": [{
    "path": "/api/system/run-workflows",
    "schedule": "*/10 * * * *"
  }]
}
```

**Supabase Schedule (pg_cron):**
```sql
SELECT cron.schedule(
  'run-workflows',
  '*/10 * * * *',
  $$SELECT net.http_post('https://your-app.vercel.app/api/system/run-workflows')$$
);
```

## Error Handling

- Failed step executions are logged with `error_message`
- Steps marked as `error` status are not retried automatically
- All actions are logged to `deal_timeline_events` for audit

## Performance Considerations

- Indexes on `workflow_run_steps.scheduled_for` for efficient scheduler queries
- Indexes on foreign keys for join performance
- RLS policies ensure team-scoped access without client exposure

## Future Enhancements

- Email retry logic with exponential backoff
- Step retry mechanism for failed actions
- Workflow versioning and rollback
- Custom workflow builder UI
- Real-time step execution notifications

