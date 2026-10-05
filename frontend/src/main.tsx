import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from '@/app/router'
import { syncColorSchemeClass } from '@/lib/color-scheme'
import { queryClient } from '@/lib/query-client'
import './index.css'

syncColorSchemeClass()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
)
