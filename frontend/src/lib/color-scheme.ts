import { useSyncExternalStore } from 'react'

// The app follows the OS light/dark setting. index.html applies the class before
// first paint; this keeps it in sync if the setting changes while the app is open.
const query = window.matchMedia('(prefers-color-scheme: dark)')

function subscribe(onChange: () => void): () => void {
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function syncColorSchemeClass(): void {
  const apply = () => document.documentElement.classList.toggle('dark', query.matches)
  apply()
  query.addEventListener('change', apply)
}

export function useColorScheme(): 'light' | 'dark' {
  return useSyncExternalStore(subscribe, () => (query.matches ? 'dark' : 'light'))
}
