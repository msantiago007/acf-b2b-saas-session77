/**
 * Organization Settings API Routes
 *
 * Handles READ and UPDATE operations for organization settings.
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
const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').optional(),
  plan: z.enum(['free', 'pro', 'enterprise'], {
    errorMap: () => ({ message: 'Plan must be one of: free, pro, enterprise' }),
  }).optional(),
  settings: z.record(z.any()).optional(),
});

/**
 * GET /api/orgs/:orgId
 * Fetch organization details
 * Requires: 'read' permission
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const startTime = Date.now();

  return withRbac(req, params.orgId, ['read'], async (context) => {
    try {
      logApiRequest('GET', `/api/orgs/${params.orgId}`, context.user.id, params.orgId);

      // Query organization using service role
      const { data: organization, error } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('id', params.orgId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw ApiErrors.notFound('Organization');
        }
        throw error;
      }

      logApiResponse('GET', `/api/orgs/${params.orgId}`, 200, Date.now() - startTime);

      return successResponse({
        organization,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

/**
 * PUT /api/orgs/:orgId
 * Update organization settings
 * Requires: 'manage_org' permission (owner)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const startTime = Date.now();

  return withRbac(req, params.orgId, ['manage_org'], async (context) => {
    try {
      logApiRequest('PUT', `/api/orgs/${params.orgId}`, context.user.id, params.orgId);

      const body = await req.json();

      // Validate request body
      const validation = updateOrganizationSchema.safeParse(body);
      if (!validation.success) {
        throw ApiErrors.validationError(
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const updates = validation.data;

      // Check if organization exists
      const { data: existingOrg } = await supabaseAdmin
        .from('organizations')
        .select('id, name, plan')
        .eq('id', params.orgId)
        .single();

      if (!existingOrg) {
        throw ApiErrors.notFound('Organization');
      }

      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }

      if (updates.plan !== undefined) {
        updateData.plan = updates.plan;
      }

      if (updates.settings !== undefined) {
        updateData.settings = updates.settings;
      }

      // Update organization
      const { data: updatedOrg, error: updateError } = await supabaseAdmin
        .from('organizations')
        .update(updateData)
        .eq('id', params.orgId)
        .select('*')
        .single();

      if (updateError) {
        throw updateError;
      }

      logApiResponse('PUT', `/api/orgs/${params.orgId}`, 200, Date.now() - startTime);

      return successResponse(
        {
          organization: updatedOrg,
        },
        'Organization updated successfully'
      );
    } catch (error) {
      return handleApiError(error);
    }
  });
}
