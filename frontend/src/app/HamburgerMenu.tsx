import { FilePlus2, LayoutList, LogOut, Map as MapIcon, Menu, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useLogout } from '@/features/auth/api'
import { useCurrentUser } from '@/features/auth/current-user'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

const NAV: NavItem[] = [
  { to: '/', label: 'Map', icon: MapIcon, end: true },
  { to: '/entries', label: 'My Entries', icon: LayoutList, end: true },
  { to: '/entries/new', label: 'Add New Entry', icon: FilePlus2 },
  { to: '/profile', label: 'My Profile', icon: UserRound },
]

const ADMIN_NAV: NavItem = { to: '/admin', label: 'Admin Panel', icon: ShieldCheck }

export function HamburgerMenu() {
  const user = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  // Admin link is only rendered for superadmins; the API enforces the same rule server-side.
  const items = user.is_superadmin ? [...NAV, ADMIN_NAV] : NAV

  const onLogout = async () => {
    try {
      await logout.mutateAsync()
    } catch (error) {
      toast.error(`Logout may not have completed. ${errorMessage(error)}`)
    }
    navigate('/login', { replace: true })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 gap-0 p-0">
        <SheetHeader className="h-14 justify-center border-b px-4">
          <SheetTitle>
            <Wordmark />
          </SheetTitle>
          <SheetDescription className="sr-only">Main navigation</SheetDescription>
        </SheetHeader>

        <div className="px-4 py-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          {user.is_superadmin && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground">
              <ShieldCheck className="size-3.5" aria-hidden />
              Superadmin
            </p>
          )}
        </div>

        <Separator />

        <nav aria-label="Main" className="flex flex-col gap-0.5 p-2">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium outline-none transition-colors',
                  'hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive ? 'bg-accent text-accent-foreground hover:bg-accent' : 'text-foreground/85',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t p-2">
          <button
            type="button"
            onClick={onLogout}
            disabled={logout.isPending}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-foreground/85 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <LogOut className="size-4" aria-hidden />
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
