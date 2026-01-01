'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'

export default function AuthCheck() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [sessionInfo, setSessionInfo] = useState<string>('')

  useEffect(() => {
    // Check for existing session on mount
    checkSession()
  }, [])

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setUser(data.user)
      setSessionInfo('Logged in! Auth cookies now set. You can now test API routes.')
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setSessionInfo('')
    setLoading(false)
  }

  const testApiCall = async () => {
    setSessionInfo('Testing API call...')
    try {
      const response = await fetch('/api/orgs/00000000-0000-0000-0000-000000000001/teams')
      const data = await response.json()

      if (response.ok) {
        setSessionInfo(`API call successful! Retrieved ${data.length || 0} teams:\n${JSON.stringify(data, null, 2)}`)
      } else {
        setSessionInfo(`API call failed with status ${response.status}:\n${JSON.stringify(data, null, 2)}`)
      }
    } catch (err: any) {
      setSessionInfo(`API call error: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Auth & RBAC Test Page</h1>
          <p className="text-gray-600 mb-6">
            Use this page to login and test authenticated API requests for RBAC validation.
          </p>

          {!user ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Login as Test User</h2>

              <button
                onClick={() => handleLogin('owner@acme-test.com', 'TestPass123!')}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login as Owner (Full Access)'}
              </button>

              <button
                onClick={() => handleLogin('admin@acme-test.com', 'TestPass123!')}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login as Admin (Manage Team/Members)'}
              </button>

              <button
                onClick={() => handleLogin('member@acme-test.com', 'TestPass123!')}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login as Member (Read/Write Only)'}
              </button>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-700 font-medium">Login Error</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-green-700 font-medium">Logged In Successfully</p>
                <p className="text-green-600 text-sm">User: {user.email}</p>
                <p className="text-green-600 text-sm">User ID: {user.id}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={testApiCall}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  Test API Call: GET /api/orgs/.../teams
                </button>

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
              </div>

              {sessionInfo && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-blue-700 font-medium mb-2">Session Info</p>
                  <pre className="text-blue-600 text-xs overflow-x-auto whitespace-pre-wrap">
                    {sessionInfo}
                  </pre>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 p-4 rounded">
                <p className="text-gray-700 font-medium mb-2">User Object</p>
                <pre className="text-xs overflow-x-auto bg-gray-900 text-green-400 p-4 rounded">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                <p className="text-yellow-700 font-medium mb-2">Testing Instructions</p>
                <ol className="text-yellow-600 text-sm space-y-1 list-decimal list-inside">
                  <li>Click "Test API Call" button to verify RBAC middleware works</li>
                  <li>Open browser DevTools → Network tab to see request/response</li>
                  <li>Try different user roles to test permission enforcement</li>
                  <li>Check cookies (Application → Cookies) to see auth tokens</li>
                </ol>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded">
                <p className="text-gray-700 font-medium mb-2">Permission Matrix</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2">Role</th>
                      <th className="text-left py-2">Permissions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b border-gray-200">
                      <td className="py-2 font-medium">owner</td>
                      <td className="py-2">All permissions</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 font-medium">admin</td>
                      <td className="py-2">manage_team, manage_members, read, write</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">member</td>
                      <td className="py-2">read, write only</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Testing with curl</h2>
          <p className="text-gray-600 mb-4">
            If you prefer command-line testing, login here, then copy cookies from DevTools and use:
          </p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs">
{`# Get auth cookies from browser DevTools
# Application → Cookies → copy sb-access-token value

curl https://acf-b2b-saas-session77.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001/teams \\
  -H "Cookie: sb-access-token=YOUR_TOKEN_HERE; sb-refresh-token=YOUR_REFRESH_HERE"`}
          </pre>
        </div>
      </div>
    </div>
  )
}
