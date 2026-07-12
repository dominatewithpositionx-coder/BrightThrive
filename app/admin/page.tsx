import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin | BrytThrive',
  robots: { index: false, follow: false },
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

type Row = {
  id: string
  email: string
  name: string | null
  source: string | null
  created_at: string
}

export default async function AdminPage() {
  // Read the Supabase auth token from cookies to identify the current user
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()
  const authCookie = allCookies.find(c =>
    c.name.includes('auth-token') || c.name.includes('access_token')
  )

  // If no ADMIN_EMAILS configured, deny all access
  if (ADMIN_EMAILS.length === 0) {
    redirect('/login')
  }

  // Use the admin client to verify the user via the access token in cookies
  let userEmail: string | null = null

  const accessTokenCookie = allCookies.find(c => c.name.endsWith('-auth-token'))
  if (accessTokenCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(accessTokenCookie.value))
      const token = Array.isArray(parsed) ? parsed[0] : parsed
      const { data } = await supabaseAdmin.auth.getUser(token)
      userEmail = data?.user?.email ?? null
    } catch {
      // malformed cookie — fall through to redirect
    }
  }

  if (!userEmail || !ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
    redirect('/login')
  }

  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .select('id,email,name,source,created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-semibold mb-6">Waitlist</h1>
        <p className="text-red-600">Error: {error.message}</p>
      </main>
    )
  }

  const rows = (data ?? []) as Row[]

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Waitlist</h1>
          <p className="text-sm text-gray-500 mt-1">{rows.length} total signups</p>
        </div>
        <a
          href="/api/export/csv"
          target="_blank"
          className="inline-flex items-center rounded-md bg-black px-3 py-2 text-white hover:opacity-90"
        >
          Download CSV
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Source</th>
              <th className="py-2 pr-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4">{r.email}</td>
                <td className="py-2 pr-4">{r.name ?? '—'}</td>
                <td className="py-2 pr-4">{r.source ?? '—'}</td>
                <td className="py-2 pr-4">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
