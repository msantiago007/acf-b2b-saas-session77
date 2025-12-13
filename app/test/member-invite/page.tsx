'use client'

import { useState } from 'react'
import { MemberInviteForm } from '@/components/MemberInviteForm'
import { createBrowserClient } from '@supabase/ssr'

export default function TestMemberInvite() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [invites, setInvites] = useState<any[]>([])

  // Test organization ID from Session 77
  const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001'

  const handleSubmit = async (data: any) => {
    try {
      setStatus({ type: 'info', message: 'Processing invite...' })

      // In a real app, this would:
      // 1. Create a pending invitation record
      // 2. Send email to the invitee
      // 3. Generate invitation token

      // For testing, we'll simulate by logging the invite
      console.log('Invite data:', {
        email: data.email,
        role: data.role,
        message: data.message,
        organization_id: TEST_ORG_ID,
        invited_at: new Date().toISOString()
      })

      // Store in temporary array for demo
      const newInvite = {
        id: crypto.randomUUID(),
        email: data.email,
        role: data.role,
        message: data.message,
        organization_id: TEST_ORG_ID,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      setInvites(prev => [newInvite, ...prev])

      setStatus({
        type: 'success',
        message: `Invitation sent to ${data.email} with role "${data.role}"!`
      })

      // In production, you would:
      // const { error } = await supabase.from('invitations').insert({...})
    } catch (err) {
      console.error('Submission error:', err)
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
      throw err
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Test: Member Invite Form
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Testing HIGH RISK form with Zod validation (email + role validation)
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Test Information</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Organization ID: {TEST_ORG_ID}</li>
              <li>• Validation: Zod (email format + enum validation)</li>
              <li>• Risk Level: HIGH</li>
              <li>• Note: This demo simulates invites (no actual email sent)</li>
            </ul>
          </div>

          {status && (
            <div className={`rounded-md p-4 mb-4 ${
              status.type === 'success' ? 'bg-green-50 border border-green-200' :
              status.type === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-sm ${
                status.type === 'success' ? 'text-green-800' :
                status.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {status.message}
              </p>
            </div>
          )}

          {invites.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Sent Invitations ({invites.length})</h3>
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div key={invite.id} className="text-xs text-gray-600 border-b border-gray-200 pb-2">
                    <div className="font-medium">{invite.email}</div>
                    <div className="text-gray-500">
                      Role: <span className="font-semibold">{invite.role}</span>
                      {invite.message && (
                        <span className="ml-2 italic">"{invite.message}"</span>
                      )}
                    </div>
                    <div className="text-gray-400 mt-1">
                      Status: {invite.status} • Sent: {new Date(invite.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <MemberInviteForm
            onSubmit={handleSubmit}
            mode="create"
          />
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Validation Tests to Try</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>✓ Valid invite: Enter "newuser@example.com" with role "member"</li>
            <li>✓ Invalid email: Try "not-an-email" - Zod should catch it</li>
            <li>✓ Empty email: Submit without email - Zod validation error</li>
            <li>✓ Empty role: Submit without role - Zod validation error</li>
            <li>✓ Valid email formats: test@example.com, user+tag@domain.co.uk</li>
            <li>✓ Optional message: Works with or without personal message</li>
          </ul>
        </div>

        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-orange-800 mb-2">Production Implementation Note</h3>
          <p className="text-sm text-orange-700">
            This test page simulates the invite process. In production, this would:
          </p>
          <ul className="text-sm text-orange-700 space-y-1 mt-2 ml-4">
            <li>1. Create an "invitations" table record</li>
            <li>2. Generate a secure invitation token</li>
            <li>3. Send email via Supabase Auth or email service</li>
            <li>4. Track invitation status (pending/accepted/expired)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
