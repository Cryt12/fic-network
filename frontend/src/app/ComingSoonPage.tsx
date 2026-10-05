import { Hammer } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/use-document-title'

type ComingSoonPageProps = {
  title: string
  phase: number
}

/** Stand-in for menu destinations that later phases build. */
export function ComingSoonPage({ title, phase }: ComingSoonPageProps) {
  useDocumentTitle(title)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <EmptyState
        className="mt-8"
        icon={Hammer}
        title="Not built yet"
        description={`This page arrives in Phase ${phase}. The menu link is here so you can check navigation.`}
        action={
          <Button asChild variant="outline">
            <Link to="/">Back to the map</Link>
          </Button>
        }
      />
    </main>
  )
}
