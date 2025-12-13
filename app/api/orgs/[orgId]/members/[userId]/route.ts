/**
 * Individual Member Management API Routes
 *
 * Handles UPDATE and DELETE operations for specific organization members.
 * Uses service role key to bypass RLS for admin operations.
 * Created: Session 80
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  handleApiError,
  successResponse,
  ApiErrors,
  logApiRequest,
  logApiResponse,
} from '@/lib/api-error';
import { withRbac } from '@/lib/rbac-middleware';

// Initialize Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Validation schema
const updateRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer'], {
    errorMap: () => ({ message: 'Role must be one of: owner, admin, member, viewer' }),
  }),
});

/**
 * PUT /api/orgs/:orgId/members/:userId
 * Update member role
 * Requires: 'invite_members' permission (admin+)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { orgId: string; userId: string } }
) {
  const startTime = Date.now();

  return withRbac(req, params.orgId, ['invite_members'], async (context) => {
    try {
      logApiRequest('PUT', `/api/orgs/${params.orgId}/members/${params.userId}`, context.user.id, params.orgId);

      const body = await req.json();

      // Validate request body
      const validation = updateRoleSchema.safeParse(body);
      if (!validation.success) {
        throw ApiErrors.validationError(
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const { role } = validation.data;

      // Check if member exists
      const { data: existingMember } = await supabaseAdmin
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', params.orgId)
        .eq('user_id', params.userId)
        .single();

      if (!existingMember) {
        throw ApiErrors.notFound('Member');
      }

      // Update role
      const { data: updatedMember, error: updateError } = await supabaseAdmin
        .from('organization_members')
        .update({ role })
        .eq('organization_id', params.orgId)
        .eq('user_id', params.userId)
        .select(`
          user_id,
          role,
          created_at,
          users (
            email
          )
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      logApiResponse('PUT', `/api/orgs/${params.orgId}/members/${params.userId}`, 200, Date.now() - startTime);

      return successResponse(
        {
          member: {
            id: updatedMember.user_id,
            user_id: updatedMember.user_id,
            email: (updatedMember as any).users?.email || 'Unknown',
            role: updatedMember.role,
            created_at: updatedMember.created_at,
          },
        },
        'Member role updated successfully'
      );
    } catch (error) {
      return handleApiError(error);
    }
  });
}

/**
 * DELETE /api/orgs/:orgId/members/:userId
 * Remove member from organization
 * Requires: 'remove_members' permission (admin+)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgId: string; userId: string } }
) {
  const startTime = Date.now();

  return withRbac(req, params.orgId, ['remove_members'], async (context) => {
    try {
      logApiRequest('DELETE', `/api/orgs/${params.orgId}/members/${params.userId}`, context.user.id, params.orgId);

      // Prevent removing yourself
      if (params.userId === context.user.id) {
        throw ApiErrors.cannotRemoveSelf();
      }

      // Check if member exists
      const { data: existingMember } = await supabaseAdmin
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', params.orgId)
        .eq('user_id', params.userId)
        .single();

      if (!existingMember) {
        throw ApiErrors.notFound('Member');
      }

      // Delete member
      const { error: deleteError } = await supabaseAdmin
        .from('organization_members')
        .delete()
        .eq('organization_id', params.orgId)
        .eq('user_id', params.userId);

      if (deleteError) {
        throw deleteError;
      }

      logApiResponse('DELETE', `/api/orgs/${params.orgId}/members/${params.userId}`, 200, Date.now() - startTime);

      return successResponse(
        { userId: params.userId },
        'Member removed successfully'
      );
    } catch (error) {
      return handleApiError(error);
    }
  });
}
