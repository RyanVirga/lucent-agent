// Runtime-safe parsing of auto_config JSON from workflow steps

import type { WorkflowStepActionType } from '@/types/database'

// Base config structure
export interface BaseAutoConfig {
  action_type: WorkflowStepActionType
}

// Send email action config
export interface SendEmailConfig extends BaseAutoConfig {
  action_type: 'send_email'
  template_name: string
  audience: string // 'buyer', 'seller', 'lender', etc.
}

// Create task action config
export interface CreateTaskConfig extends BaseAutoConfig {
  action_type: 'create_task'
  title: string
  description?: string
  due_date_offset_days?: number
}

// Update field action config
export interface UpdateFieldConfig extends BaseAutoConfig {
  action_type: 'update_field'
  field: string // Deal field name
  value: unknown
}

// Wait for event action config
export interface WaitForEventConfig extends BaseAutoConfig {
  action_type: 'wait_for_event'
  event_type: string // 'emd_received', 'inspection_contingency_removed', etc.
}

export type AutoConfig = SendEmailConfig | CreateTaskConfig | UpdateFieldConfig | WaitForEventConfig

// Type guard functions for runtime-safe parsing
export function isSendEmailConfig(config: unknown): config is SendEmailConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'action_type' in config &&
    config.action_type === 'send_email' &&
    'template_name' in config &&
    'audience' in config
  )
}

export function isCreateTaskConfig(config: unknown): config is CreateTaskConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'action_type' in config &&
    config.action_type === 'create_task' &&
    'title' in config
  )
}

export function isUpdateFieldConfig(config: unknown): config is UpdateFieldConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'action_type' in config &&
    config.action_type === 'update_field' &&
    'field' in config &&
    'value' in config
  )
}

export function isWaitForEventConfig(config: unknown): config is WaitForEventConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'action_type' in config &&
    config.action_type === 'wait_for_event' &&
    'event_type' in config
  )
}

// Parse auto_config JSONB into typed config
export function parseAutoConfig(config: unknown): AutoConfig | null {
  if (!config || typeof config !== 'object') {
    return null
  }

  if (isSendEmailConfig(config)) return config
  if (isCreateTaskConfig(config)) return config
  if (isUpdateFieldConfig(config)) return config
  if (isWaitForEventConfig(config)) return config

  return null
}

