/**
 * Member Management API Routes
 *
 * Handles CRUD operations for organization members.
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
const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['owner', 'admin', 'member', 'viewer'], {
    errorMap: () => ({ message: 'Role must be one of: owner, admin, member, viewer' }),
  }),
  message: z.string().optional(),
});

/**
 * GET /api/orgs/:orgId/members
 * List all members in organization
 * Requires: 'read' permission
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const startTime = Date.now();

  return withRbac(req, params.orgId, ['read'], async (context) => {
    try {
      logApiRequest('GET', `/api/orgs/${params.orgId}/members`, context.user.id, params.orgId);

      // Query organization members with user details using service role
      const { data: members, error } = await supabaseAdmin
        .from('organization_members')
        .select(`
          user_id,
          role,
          created_at,
          users (
            id,
            email
          )
        `)
        .eq('organization_id', params.orgId)
        .order('role', { ascending: true });

      if (error) {
        throw error;
      }

      // Transform data to flatten user details
      const formattedMembers = members?.map((member: any) => ({
        id: member.user_id,
        user_id: member.user_id,
        email: member.users?.email || 'Unknown',
        role: member.role,
        created_at: member.created_at,
      })) || [];

      logApiResponse('GET', `/api/orgs/${params.orgId}/members`, 200, Date.now() - startTime);

      return successResponse({
        members: formattedMembers,
        count: formattedMembers.length,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

/**
 * POST /api/orgs/:orgId/members
 * Invite new member to organization
 * Requires: 'invite_members' permission
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const startTime = Date.now();

  return withRbac(req, params.orgId, ['invite_members'], async (context) => {
    try {
      logApiRequest('POST', `/api/orgs/${params.orgId}/members`, context.user.id, params.orgId);

      const body = await req.json();

      // Validate request body
      const validation = inviteMemberSchema.safeParse(body);
      if (!validation.success) {
        throw ApiErrors.validationError(
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const { email, role, message } = validation.data;

      // Check if user already exists in auth.users
      const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = existingAuthUser.users.find((u) => u.email === email);

      let userId: string;

      if (authUser) {
        // User exists in auth system
        userId = authUser.id;

        // Check if already a member
        const { data: existingMember } = await supabaseAdmin
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', params.orgId)
          .eq('user_id', userId)
          .single();

        if (existingMember) {
          throw ApiErrors.conflict('User is already a member of this organization');
        }
      } else {
        // Create new auth user (invitation)
        const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true, // Auto-confirm for testing
          user_metadata: {
            invited_to_org: params.orgId,
            invited_by: context.user.id,
            invitation_message: message,
          },
        });

        if (authError) {
          throw authError;
        }

        userId = newAuthUser.user.id;

        // Add to users table
        const { error: userInsertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            email: email,
          });

        if (userInsertError) {
          // Rollback auth user creation
          await supabaseAdmin.auth.admin.deleteUser(userId);
          throw userInsertError;
        }
      }

      // Add to organization_members
      const { data: newMember, error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          organization_id: params.orgId,
          user_id: userId,
          role: role,
        })
        .select()
        .single();

      if (memberError) {
        throw memberError;
      }

      logApiResponse('POST', `/api/orgs/${params.orgId}/members`, 201, Date.now() - startTime);

      return successResponse(
        {
          member: {
            id: userId,
            user_id: userId,
            email: email,
            role: role,
            created_at: newMember.created_at,
          },
        },
        'Member invited successfully',
        201
      );
    } catch (error) {
      return handleApiError(error);
    }
  });
}

