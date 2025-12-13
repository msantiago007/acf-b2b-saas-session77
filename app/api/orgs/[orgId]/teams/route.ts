/**
 * Teams API Route
 * Demonstrates RBAC middleware usage
 *
 * GET /api/orgs/:orgId/teams - List teams (requires 'read' permission)
 * POST /api/orgs/:orgId/teams - Create team (requires 'manage_team' permission)
 */

import { NextResponse } from 'next/server'
import { requirePermission, AuthenticatedRequest } from '@/lib/rbac-middleware'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/orgs/:orgId/teams
 * List all teams in organization
 * Requires: 'read' permission (viewer, member, admin, owner)
 */
export const GET = requirePermission('read')(
  async (req: AuthenticatedRequest, context: { params: { orgId: string } }) => {
    const { orgId } = context.params

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Query teams for organization
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch teams', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      teams,
      organization: req.org,
      user: {
        id: req.user!.id,
        role: req.membership!.role,
      },
    })
  }
)

/**
 * POST /api/orgs/:orgId/teams
 * Create a new team
 * Requires: 'manage_team' permission (admin, owner)
 */
export const POST = requirePermission('manage_team')(
  async (req: AuthenticatedRequest, context: { params: { orgId: string } }) => {
    const { orgId } = context.params

    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { name, description } = body

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create team
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        organization_id: orgId,
        name,
        description: description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create team', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        team,
        message: 'Team created successfully',
      },
      { status: 201 }
    )
  }
)

/**
 * Example: DELETE endpoint (requires 'delete' permission)
 * Commented out - uncomment to enable
 */
/*
export const DELETE = requirePermission('delete')(
  async (req: AuthenticatedRequest, context: { params: { orgId: string; teamId: string } }) => {
    const { orgId, teamId } = context.params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)
      .eq('organization_id', orgId)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete team', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Team deleted successfully' })
  }
)
*/
