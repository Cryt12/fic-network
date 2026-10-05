import { MapPinOff } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/use-document-title'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <main className="grid min-h-full place-items-center p-6">
      <EmptyState
        icon={MapPinOff}
        title="Page not found"
        description="This page doesn't exist, or you don't have access to it."
        action={
          <Button asChild variant="outline">
            <Link to="/">Back to the map</Link>
          </Button>
        }
      />
    </main>
  )
}
