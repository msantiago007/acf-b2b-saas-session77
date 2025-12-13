'use client'

import { useState } from 'react'
import { MemberRoleForm } from '@/components/MemberRoleForm'
import { createBrowserClient } from '@supabase/ssr'

export default function TestMemberRole() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [members, setMembers] = useState<any[]>([])

  // Test organization ID from Session 77
  const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001'

  const handleSubmit = async (data: any) => {
    try {
      setStatus({ type: 'info', message: 'Updating member role...' })

      // Update organization_member in Supabase
      const { error, data: updatedMember } = await supabase
        .from('organization_members')
        .update({
          role: data.role
        })
        .eq('organization_id', TEST_ORG_ID)
        .eq('user_id', data.user_id)
        .select()

      if (error) {
        console.error('Update failed:', error)
        setStatus({ type: 'error', message: `Update failed: ${error.message}` })
        throw error
      }

      console.log('Role updated:', updatedMember)
      setStatus({ type: 'success', message: `Role updated to "${data.role}" successfully!` })

      // Reload members list
      loadMembers()
    } catch (err) {
      console.error('Submission error:', err)
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
      throw err
    }
  }

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', TEST_ORG_ID)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Load failed:', error)
      setStatus({ type: 'error', message: `Load failed: ${error.message}` })
    } else {
      console.log('Current members:', data)
      setMembers(data || [])
      setStatus({ type: 'success', message: `Loaded ${data?.length || 0} members from database` })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Test: Member Role Form
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Testing MEDIUM RISK form with HTML5 validation + Real Supabase operations
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Test Information</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Organization ID: {TEST_ORG_ID}</li>
              <li>• Validation: HTML5 (browser native)</li>
              <li>• Risk Level: MEDIUM</li>
              <li>• Database: Real Supabase operations</li>
            </ul>
          </div>

          <button
            onClick={loadMembers}
            className="mb-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Load Members from Database
          </button>

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

          {members.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Existing Members ({members.length})</h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="text-xs text-gray-600 border-b border-gray-200 pb-2">
                    <div className="font-medium">User ID: {member.user_id}</div>
                    <div className="text-gray-500">Role: <span className="font-semibold">{member.role}</span></div>
                    <div className="text-gray-400 mt-1">
                      Created: {new Date(member.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Update Member Role</h2>
          <p className="text-sm text-gray-600 mb-4">
            Select a user_id from the list above and choose a new role.
          </p>
          <MemberRoleForm
            onSubmit={handleSubmit}
            mode="edit"
          />
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Validation Tests to Try</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>✓ Valid update: Enter a user_id from list above and select new role</li>
            <li>✓ Empty user_id: Submit without user_id - HTML5 should block</li>
            <li>✓ Empty role: Submit without role selection - HTML5 should block</li>
            <li>✓ Role validation: Dropdown ensures only valid enum values</li>
            <li>✓ Non-existent user: Try random UUID - Supabase will return no rows</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
