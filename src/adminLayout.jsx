import { NavLink, useLocation } from 'react-router-dom'

export function AdminLayout({ children, onLogout }) {
  const location = useLocation()
  const links = [
    { to: '/', label: 'Dashboard', icon: '◉' },
    { to: '/projects', label: 'Projects', icon: '▣' },
    { to: '/queues', label: 'Queues', icon: '⧉' },
    { to: '/jobs', label: 'Jobs', icon: '⚙' },
    { to: '/workers', label: 'Workers', icon: '◎' },
    { to: '/analytics', label: 'Analytics', icon: '◌' },
    { to: '/dead-letter', label: 'Dead Letter', icon: '✕' },
    { to: '/logs', label: 'Logs', icon: '☰' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-800 bg-slate-900/95 p-5 backdrop-blur lg:sticky lg:top-0 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:p-6">
          <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 font-semibold">JD</div>
              <div>
                <h2 className="text-lg font-semibold">Job Distributor</h2>
                <p className="text-sm text-slate-400">Operations hub</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1.5">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-950/40' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-400">
            <div className="font-medium text-slate-200">System status</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span>Workers active</span>
            </div>
            <button onClick={onLogout} className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-left text-slate-200 transition hover:bg-slate-700">
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h1 className="text-2xl font-semibold">{links.find((link) => link.to === location.pathname)?.label || 'Dashboard'}</h1>
              <p className="mt-1 text-sm text-slate-400">Monitor queues, jobs, workers, retries, and failures from one place.</p>
            </div>
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400">
              Live pipeline
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
