export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">B2B SaaS Platform</h1>
        <p className="text-lg text-gray-600 mb-8">
          ML-Generated multi-tenant application with role-based access control
        </p>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Generated Components (Session 76)</h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>OrganizationSettingsForm (HIGH risk, Zod validation)</li>
              <li>TeamCreationForm (MEDIUM risk, HTML5 validation)</li>
              <li>MemberRoleForm (MEDIUM risk)</li>
              <li>MemberInviteForm (HIGH risk, auth-critical)</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">RBAC Middleware</h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Permission-based access control</li>
              <li>Role hierarchy (viewer → member → admin → owner)</li>
              <li>Supabase Auth integration</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Database Schemas</h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Organizations (HIGH risk, RLS enabled)</li>
              <li>Teams (MEDIUM risk)</li>
              <li>OrganizationMembers (HIGH risk, RLS enabled)</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
