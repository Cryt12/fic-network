/**
 * "Chrome on Windows" from a User-Agent string. Deliberately rough: it's for a human
 * glancing at login history, and the full string is still shown on hover.
 */
export function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device'

  const browser =
    /Edg\//.test(userAgent) ? 'Edge'
    : /OPR\/|Opera/.test(userAgent) ? 'Opera'
    : /Firefox\//.test(userAgent) ? 'Firefox'
    : /Chrome\//.test(userAgent) ? 'Chrome'
    : /Safari\//.test(userAgent) ? 'Safari'
    : null

  const os =
    /Android/.test(userAgent) ? 'Android'
    : /iPhone|iPad|iPod/.test(userAgent) ? 'iOS'
    : /Windows/.test(userAgent) ? 'Windows'
    : /Mac OS X|Macintosh/.test(userAgent) ? 'macOS'
    : /Linux/.test(userAgent) ? 'Linux'
    : null

  if (browser && os) return `${browser} on ${os}`
  return browser ?? os ?? 'Other device'
}
