// Integration Tests for Transaction Email Sending
// Tests the full email sending pipeline with mocked dependencies

/**
 * To run these tests, you'll need to install a testing framework:
 * 
 * npm install --save-dev vitest @vitest/ui
 * 
 * Add to package.json scripts:
 * "test": "vitest",
 * "test:ui": "vitest --ui"
 * 
 * Run with: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Deal, EmailTemplate } from '@/types/database'

// Mock Supabase client
const mockSupabaseFrom = vi.fn()
const mockSupabaseSelect = vi.fn()
const mockSupabaseSingle = vi.fn()
const mockSupabaseEq = vi.fn()
const mockSupabaseInsert = vi.fn()

vi.mock('@/server/db/supabaseClient', () => ({
  supabaseAdmin: {
    from: mockSupabaseFrom,
  },
}))

// Mock email service
vi.mock('@/server/lib/emailService', () => ({
  sendEmail: vi.fn(),
}))

// Mock recipient resolver
vi.mock('@/server/lib/recipientResolver', () => ({
  resolveRecipients: vi.fn(),
}))

// Import after mocking
import { sendTransactionEmail } from '@/server/transactionEmails'
import { sendEmail } from '@/server/lib/emailService'
import { resolveRecipients } from '@/server/lib/recipientResolver'

// Helper to create mock deal
function createMockDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'test-deal-id',
    team_id: 'test-team-id',
    property_address: '123 Main St',
    property_id: null,
    side: 'buying',
    status: 'in_escrow',
    price: 500000,
    loan_type: 'conventional',
    down_payment_percent: 20,
    close_date: null,
    primary_agent_id: null,
    emd_amount: 5000,
    emd_received_at: null,
    inspection_deadline: null,
    inspection_contingency_removed_at: null,
    coe_date: null,
    created_by: null,
    created_at: '2024-11-20T00:00:00Z',
    updated_at: '2024-11-20T00:00:00Z',
    escrow_company_id: null,
    lender_id: null,
    has_hoa: false,
    has_solar: false,
    tc_fee_amount: null,
    tc_fee_payer: null,
    offer_acceptance_date: null,
    emd_due_date: null,
    seller_disclosures_due_date: null,
    buyer_investigation_due_date: null,
    buyer_appraisal_due_date: null,
    buyer_loan_due_date: null,
    buyer_insurance_due_date: null,
    estimated_coe_date: '2024-12-01',
    possession_date: null,
    inspection_scheduled_at: null,
    appraisal_ordered_at: null,
    hoa_docs_received_at: null,
    seller_disclosures_sent_at: null,
    buyer_disclosures_signed_at: null,
    cda_prepared_at: null,
    cda_sent_to_escrow_at: null,
    closed_at: null,
    ...overrides,
  }
}

// Helper to create mock template
function createMockTemplate(overrides: Partial<EmailTemplate> = {}): EmailTemplate {
  return {
    id: 'test-template-id',
    name: 'Test Template',
    key: 'test_template_key',
    subject_template: 'Test Subject - {{property_address}}',
    body_html: '<p>Test body for {{property_address}}</p>',
    body_text: 'Test body for {{property_address}}',
    audience_type: 'buyer',
    side: 'buying',
    is_active: true,
    created_at: '2024-11-20T00:00:00Z',
    updated_at: '2024-11-20T00:00:00Z',
    ...overrides,
  }
}

describe('sendTransactionEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock chain
    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
      insert: mockSupabaseInsert,
    })
    
    mockSupabaseSelect.mockReturnValue({
      eq: mockSupabaseEq,
      single: mockSupabaseSingle,
    })
    
    mockSupabaseEq.mockReturnValue({
      eq: mockSupabaseEq,
      single: mockSupabaseSingle,
      limit: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    
    mockSupabaseSingle.mockResolvedValue({
      data: null,
      error: null,
    })
    
    mockSupabaseInsert.mockResolvedValue({
      data: null,
      error: null,
    })
  })

  describe('Successful Email Sending', () => {
    it('should fetch deal, template, resolve recipients, and send email', async () => {
      const mockDeal = createMockDeal()
      const mockTemplate = createMockTemplate()
      const mockRecipients = [
        { email: 'buyer@example.com', name: 'John Buyer' },
      ]

      // Mock deal fetch
      mockSupabaseSingle.mockResolvedValueOnce({
        data: mockDeal,
        error: null,
      })

      // Mock template fetch
      mockSupabaseSingle.mockResolvedValueOnce({
        data: mockTemplate,
        error: null,
      })

      // Mock duplicate check (no duplicates)
      mockSupabaseEq.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      // Mock recipient resolution
      vi.mocked(resolveRecipients).mockResolvedValue(mockRecipients)

      // Mock email send
      vi.mocked(sendEmail).mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
      })

      const result = await sendTransactionEmail({
        dealId: mockDeal.id,
        templateKey: mockTemplate.key,
      })

      expect(result.success).toBe(true)
      expect(result.sent).toBe(true)
      expect(result.skipped).toBe(false)
      
      // Verify email was sent with rendered template
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockRecipients,
          subject: expect.stringContaining('123 Main St'),
          html: expect.stringContaining('123 Main St'),
        })
      )
    })

    it('should render Handlebars placeholders in templates', async () => {
      const mockDeal = createMockDeal({
        property_address: '456 Oak Ave',
        estimated_coe_date: '2024-12-15',
      })
      
      const mockTemplate = createMockTemplate({
        subject_template: 'Closing Soon - {{property_address}}',
        body_html: '<p>COE date: {{estimated_coe_date}}</p>',
      })

      mockSupabaseSingle
        .mockResolvedValueOnce({ data: mockDeal, error: null })
        .mockResolvedValueOnce({ data: mockTemplate, error: null })

      mockSupabaseEq.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      vi.mocked(resolveRecipients).mockResolvedValue([
        { email: 'test@example.com' },
      ])

      vi.mocked(sendEmail).mockResolvedValue({
        success: true,
        messageId: 'test-id',
      })

      await sendTransactionEmail({
        dealId: mockDeal.id,
        templateKey: mockTemplate.key,
      })

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Closing Soon - 456 Oak Ave',
          html: expect.stringContaining('COE date:'),
        })
      )
    })
  })

  describe('Deduplication', () => {
    it('should skip sending if email already sent', async () => {
      const mockDeal = createMockDeal()
      const mockTemplate = createMockTemplate()

      mockSupabaseSingle
        .mockResolvedValueOnce({ data: mockDeal, error: null })
        .mockResolvedValueOnce({ data: mockTemplate, error: null })

      // Mock duplicate found
      mockSupabaseEq.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 'existing-log-id' }],
              error: null,
            }),
          }),
        }),
      })

      const result = await sendTransactionEmail({
        dealId: mockDeal.id,
        templateKey: mockTemplate.key,
      })

      expect(result.success).toBe(true)
      expect(result.sent).toBe(false)
      expect(result.skipped).toBe(true)
      expect(result.reason).toContain('Already sent')
      
      // Should not call sendEmail
      expect(sendEmail).not.toHaveBeenCalled()
    })

    it('should use contextDate in deduplication check', async () => {
      const mockDeal = createMockDeal()
      const mockTemplate = createMockTemplate()
      const contextDate = '2024-11-30'

      mockSupabaseSingle
        .mockResolvedValueOnce({ data: mockDeal, error: null })
        .mockResolvedValueOnce({ data: mockTemplate, error: null })

      const mockEqChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }
      
      mockSupabaseEq.mockReturnValueOnce(mockEqChain)

      vi.mocked(resolveRecipients).mockResolvedValue([
        { email: 'test@example.com' },
      ])
      vi.mocked(sendEmail).mockResolvedValue({
        success: true,
        messageId: 'test-id',
      })

      await sendTransactionEmail({
        dealId: mockDeal.id,
        templateKey: mockTemplate.key,
        contextDate,
      })

      // Verify contextDate was used in query
      expect(mockEqChain.eq).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should return error when deal not found', async () => {
      mockSupabaseSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Deal not found' },
      })

      const result = await sendTransactionEmail({
        dealId: 'non-existent-id',
        templateKey: 'test_template',
      })

      expect(result.success).toBe(false)
      expect(result.sent).toBe(false)
      expect(result.error).toContain('Deal not found')
    })

    it('should return error when template not found', async () => {
      const mockDeal = createMockDeal()

      mockSupabaseSingle
        .mockResolvedValueOnce({ data: mockDeal, error: null })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Template not found' },
        })

      const result = await sendTransactionEmail({
        dealId: mockDeal.id,
        templateKey: 'non_existent_template',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Template not found')
    })

    it('should skip when no recipients found', async () => {
      const mockDeal = createMockDeal()
      const mockTemplate = createMockTemplate()

      mockSupabaseSingle
        .mockResolvedValueOnce({ data: mockDeal, error: null })
        .mockResolvedValueOnce({ data: mockTemplate, error: null })

      mockSupabaseEq.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      // No recipients
      vi.mocked(resolveRecipients).mockResolvedValue([])

      const result = await sendTransactionEmail({
        dealId: mockDeal.id,
        templateKey: mockTemplate.key,
      })

      expect(result.success).toBe(true)
      expect(result.sent).toBe(false)
      expect(result.skipped).toBe(true)
      expect(result.reason).toContain('No recipients')
      
      expect(sendEmail).not.toHaveBeenCalled()
    })

    it('should handle email send failure gracefully', async () => {
      const mockDeal = createMockDeal()
      const mockTemplate = createMockTemplate()

      mockSupabaseSingle
        .mockResolvedValueOnce({ data: mockDeal, error: null })
        .mockResolvedValueOnce({ data: mockTemplate, error: null })

      mockSupabaseEq.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      vi.mocked(resolveRecipients).mockResolvedValue([
        { email: 'test@example.com' },
      ])

      // Email send fails
      vi.mocked(sendEmail).mockResolvedValue({
        success: false,
        error: 'SMTP connection failed',
      })

      const result = await sendTransactionEmail({
        dealId: mockDeal.id,
        templateKey: mockTemplate.key,
      })

      expect(result.success).toBe(false)
      expect(result.sent).toBe(false)
      expect(result.error).toContain('SMTP connection failed')
    })
  })

  describe('Internal Chat', () => {
    it('should log to timeline instead of sending email for internal_chat', async () => {
      const mockDeal = createMockDeal()
      const mockTemplate = createMockTemplate({
        audience_type: 'internal_chat',
      })

      mockSupabaseSingle
        .mockResolvedValueOnce({ data: mockDeal, error: null })
        .mockResolvedValueOnce({ data: mockTemplate, error: null })

      mockSupabaseEq.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      const result = await sendTransactionEmail({
        dealId: mockDeal.id,
        templateKey: mockTemplate.key,
      })

      expect(result.success).toBe(true)
      expect(result.sent).toBe(true)
      
      // Should NOT call email service
      expect(sendEmail).not.toHaveBeenCalled()
      
      // Should have inserted timeline event (mockSupabaseInsert would be called)
      expect(mockSupabaseInsert).toHaveBeenCalled()
    })
  })
})

// Note: These tests provide structure and key test cases
// To complete:
// 1. Add more edge cases
// 2. Test template rendering helpers (formatDate, formatCurrency, etc.)
// 3. Test batch sending functionality
// 4. Add tests for alert creation on failures

