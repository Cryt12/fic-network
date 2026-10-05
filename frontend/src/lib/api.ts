/**
 * Minimal client for the Laravel API. In dev, Vite proxies /api and /sanctum to
 * Laravel, so everything is same-origin and Sanctum's session cookie rides along.
 */

export type ValidationErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly status: number
  readonly errors: ValidationErrors

  constructor(status: number, message: string, errors: ValidationErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

/** Sanctum sets the XSRF-TOKEN cookie; Laravel checks it against the X-XSRF-TOKEN header. */
async function refreshCsrfCookie(): Promise<void> {
  await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' })
}

async function send<T>(path: string, { method = 'GET', body }: RequestOptions, retryOnCsrf: boolean): Promise<T> {
  const isWrite = method !== 'GET'
  if (isWrite && !readCookie('XSRF-TOKEN')) {
    await refreshCsrfCookie()
  }

  const isForm = body instanceof FormData
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  const xsrf = readCookie('XSRF-TOKEN')
  if (isWrite && xsrf) headers['X-XSRF-TOKEN'] = xsrf

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })

  // 419 = CSRF token expired (e.g. session timed out). Get a fresh one and try once more.
  if (response.status === 419 && retryOnCsrf) {
    await refreshCsrfCookie()
    return send<T>(path, { method, body }, false)
  }

  if (response.status === 204) return undefined as T

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const payload = (data ?? {}) as { message?: string; errors?: ValidationErrors }
    throw new ApiError(response.status, payload.message ?? fallbackMessage(response.status), payload.errors)
  }

  return data as T
}

function fallbackMessage(status: number): string {
  // 502-504 with no JSON body: the dev proxy (or a gateway) couldn't reach Laravel at all.
  if (status >= 502 && status <= 504) return "Can't reach the API server. Make sure the backend is running, then try again."
  if (status >= 500) return 'The server ran into a problem. Please try again.'
  if (status === 0) return 'Could not reach the server.'
  return 'Something went wrong. Please try again.'
}

export function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return send<T>(path, options, true)
}

/** Human-readable message for any thrown value (network failures included). */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof TypeError) return 'Could not reach the server. Check your connection.'
  return 'Something went wrong. Please try again.'
}
