// Agent Dashboard API
// Returns overview of deals, tasks, and health indicators

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/db/supabaseClient'
import type { DashboardResponse } from '@/types/workflows'

export async function GET() {
  try {
    // Fetch active deals (in escrow or pending)
    const { data: deals, error: dealsError } = await supabaseAdmin
      .from('deals')
      .select('id, property_address, side, status, coe_date')
      .in('status', ['in_escrow', 'pending_contingencies', 'pending_coe'])
      .order('created_at', { ascending: false })

    if (dealsError) {
      throw new Error(`Failed to fetch deals: ${dealsError.message}`)
    }

    // Calculate health for each deal
    const activeDeals = (deals || []).map((deal) => {
      let health: 'healthy' | 'warning' | 'critical' = 'healthy'

      // Check for overdue tasks
      // This is simplified - in production, you'd check actual task due dates
      if (deal.coe_date) {
        const coeDate = new Date(deal.coe_date)
        const daysUntilCOE = Math.ceil((coeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilCOE < 0) {
          health = 'critical'
        } else if (daysUntilCOE < 7) {
          health = 'warning'
        }
      }

      return {
        id: deal.id,
        property_address: deal.property_address,
        side: deal.side,
        status: deal.status,
        coe_date: deal.coe_date,
        health,
      }
    })

    // Fetch upcoming tasks (due in next 7 days, not completed)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const { data: upcomingTasks, error: tasksError } = await supabaseAdmin
      .from('deal_tasks')
      .select(`
        id,
        deal_id,
        title,
        due_date,
        deals!inner(property_address)
      `)
      .is('completed_at', null)
      .not('due_date', 'is', null)
      .lte('due_date', sevenDaysFromNow.toISOString())
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(20)

    if (tasksError) {
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`)
    }

    // Fetch overdue tasks
    const { data: overdueTasks, error: overdueError } = await supabaseAdmin
      .from('deal_tasks')
      .select(`
        id,
        deal_id,
        title,
        due_date,
        deals!inner(property_address)
      `)
      .is('completed_at', null)
      .not('due_date', 'is', null)
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(20)

    if (overdueError) {
      throw new Error(`Failed to fetch overdue tasks: ${overdueError.message}`)
    }

    const response: DashboardResponse = {
      activeDeals,
      upcomingTasks: (upcomingTasks || []).map((task: any) => ({
        id: task.id,
        deal_id: task.deal_id,
        title: task.title,
        due_date: task.due_date,
        property_address: task.deals.property_address,
      })),
      overdueTasks: (overdueTasks || []).map((task: any) => ({
        id: task.id,
        deal_id: task.deal_id,
        title: task.title,
        due_date: task.due_date,
        property_address: task.deals.property_address,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

