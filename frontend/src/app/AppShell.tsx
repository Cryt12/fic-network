import { Outlet } from 'react-router'
import { Wordmark } from '@/components/Wordmark'
import { HamburgerMenu } from '@/app/HamburgerMenu'

export function AppShell() {
  return (
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)] bg-background">
      <header className="flex h-20 items-center gap-2 border-b-2 px-2 sm:px-4">
        <HamburgerMenu />
        <Wordmark className="h-14" />
      </header>
      <Outlet />
    </div>
  )
}
