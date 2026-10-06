import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/admin', label: 'Entries', end: true },
  { to: '/admin/users', label: 'Users', end: false },
]

/** Admin Panel frame: section tabs above the page. Superadmin-only (AdminRoute + the API). */
export function AdminLayout() {
  return (
    <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)]">
      <nav aria-label="Admin Panel" className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-[1400px] gap-1 px-4 sm:px-8">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  '-mb-px border-b-2 px-3 py-3 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <Outlet />
    </div>
  )
}
