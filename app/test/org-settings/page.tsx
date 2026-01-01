'use client'

import { useState } from 'react'
import { OrganizationSettingsForm } from '@/components/OrganizationSettingsForm'

export default function TestOrgSettings() {
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [dbData, setDbData] = useState<any>(null)

  // Test organization ID from Session 77
  const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001'

  const handleSubmit = async (data: any) => {
    try {
      setStatus({ type: 'info', message: 'Updating organization...' })

      // Update organization via API route (uses service role key)
      const response = await fetch(`/api/orgs/${TEST_ORG_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          plan: data.plan,
          settings: typeof data.settings === 'string' ? JSON.parse(data.settings) : data.settings
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Update failed:', result)
        setStatus({ type: 'error', message: `Update failed: ${result.error?.message || 'Unknown error'}` })
        throw new Error(result.error?.message || 'Update failed')
      }

      console.log('Update successful:', result)
      setStatus({ type: 'success', message: 'Organization updated successfully!' })
      setDbData(result.data?.organization)
    } catch (err) {
      console.error('Submission error:', err)
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
      throw err
    }
  }

  const loadCurrentData = async () => {
    try {
      // Load organization via API route (uses service role key to bypass RLS)
      const response = await fetch(`/api/orgs/${TEST_ORG_ID}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('Load failed:', result)
        setStatus({ type: 'error', message: `Load failed: ${result.error?.message || 'Unknown error'}` })
        return
      }

      console.log('Current data:', result.data?.organization)
      setDbData(result.data?.organization)
      setStatus({ type: 'success', message: 'Data loaded from database' })
    } catch (err) {
      console.error('Load error:', err)
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Test: Organization Settings Form
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Testing HIGH RISK form with Zod validation + Real Supabase operations
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Test Information</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Organization ID: {TEST_ORG_ID}</li>
              <li>• Validation: Zod (strict type checking)</li>
              <li>• Risk Level: HIGH</li>
              <li>• Database: Real Supabase operations</li>
            </ul>
          </div>

          <button
            onClick={loadCurrentData}
            className="mb-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Load Current Data from Database
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

          {dbData && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Database State</h3>
              <pre className="text-xs text-gray-600 overflow-x-auto">
                {JSON.stringify(dbData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <OrganizationSettingsForm
            onSubmit={handleSubmit}
            mode="edit"
            initialData={{
              name: 'Acme Corporation',
              slug: 'acme-corp',
              plan: 'pro',
              settings: { analytics: true }
            }}
          />
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Validation Tests to Try</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>✓ Valid update: Change name, plan, slug</li>
            <li>✓ Empty name: Should fail with "Organization Name is required"</li>
            <li>✓ Invalid plan: Select blank option - should fail Zod validation</li>
            <li>✓ Invalid JSON in settings: Should fail parsing</li>
            <li>✓ Duplicate slug: Try "acme-corp" if another org exists</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
