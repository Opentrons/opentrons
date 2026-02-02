const IMPORT_SRC_PARAM = 'src'
const IMPORT_NAME_PARAM = 'name'
const IMPORT_TYPE_PARAM = 'type'

export interface ImportProtocolQueryParams {
  signedUrl: string
  filename: string
  fallbackType?: string
}

function normalizeSignedUrl(rawSignedUrl: string): string {
  // Some presigned URLs include characters that are not valid in a URL string
  // (notably unescaped `"` in `response-content-disposition`).
  // Normalize those characters so `new URL()` and `fetch()` behave consistently.
  //
  // Note: This is intentionally narrow; we don't want to re-encode the entire URL
  // or mutate already-encoded sequences.
  return rawSignedUrl.replace(/"/g, '%22').replace(/\s/g, '%20')
}

function safeParseSignedUrl(rawSignedUrl: string): URL {
  try {
    return new URL(rawSignedUrl)
  } catch {
    return new URL(normalizeSignedUrl(rawSignedUrl))
  }
}

function stripOuterImportParamsFromRawUrl(rawSignedUrl: string): string {
  // If a caller passes our optional `name`/`type` params alongside an unencoded
  // `src` param, and we reconstruct `src` from the raw query remainder, those
  // `name`/`type` params could be accidentally included in the reconstructed URL.
  // Strip them defensively.
  return rawSignedUrl
    .replace(/([?&])name=[^&]*(&?)/gi, (match, p1, p2) => (p2 === '&' ? p1 : ''))
    .replace(/([?&])type=[^&]*(&?)/gi, (match, p1, p2) => (p2 === '&' ? p1 : ''))
    .replace(/[?&]$/, '')
}

function getRawParamRemainder(paramName: string, query: string): string | null {
  // Returns the raw substring after `paramName=` through the end of the query string.
  // `query` should include the leading `?`.
  const encodedParam = encodeURIComponent(paramName)
  const match = query.match(new RegExp(`(?:\\?|&)${encodedParam}=([^]*)`))
  return match?.[1] ?? null
}

function getSignedUrlFromLocation(): string | null {
  const url = new URL(window.location.href)

  // 1) Check normal search params.
  const fromSearch = url.searchParams.get(IMPORT_SRC_PARAM)
  if (fromSearch != null) {
    // If the signed URL was NOT URL-encoded, any `&X-Amz-*` params will be split
    // into the outer URL's search params. In that case, reconstruct from the raw
    // query remainder to preserve exact encoding/signature.
    const looksLikePresigned =
      url.search.includes('X-Amz-Signature=') &&
      !fromSearch.includes('X-Amz-Signature=')
    if (looksLikePresigned) {
      const rawRemainder = getRawParamRemainder(IMPORT_SRC_PARAM, url.search)
      if (rawRemainder != null && rawRemainder.trim() !== '') {
        return stripOuterImportParamsFromRawUrl(rawRemainder)
      }
    }

    return fromSearch
  }

  // 2) Check hash query (HashRouter-style URLs).
  const hash = url.hash
  const questionMarkIndex = hash.indexOf('?')
  if (questionMarkIndex < 0) return null

  const hashQueryString = hash.slice(questionMarkIndex + 1)
  const hashParams = new URLSearchParams(hashQueryString)
  const fromHash = hashParams.get(IMPORT_SRC_PARAM)
  if (fromHash != null) {
    const looksLikePresigned =
      hashQueryString.includes('X-Amz-Signature=') &&
      !fromHash.includes('X-Amz-Signature=')
    if (looksLikePresigned) {
      const rawRemainder = getRawParamRemainder(
        IMPORT_SRC_PARAM,
        `?${hashQueryString}`
      )
      if (rawRemainder != null && rawRemainder.trim() !== '') {
        return stripOuterImportParamsFromRawUrl(rawRemainder)
      }
    }

    return fromHash
  }

  return null
}

function inferFilenameFromSignedUrl(signedUrl: string): string {
  try {
    const url = safeParseSignedUrl(signedUrl)

    // If present, prefer the explicit response-content-disposition filename.
    // Example (decoded): attachment; filename="Bead_clean_fixed.py"
    const responseContentDisposition = url.searchParams.get(
      'response-content-disposition'
    )

    if (responseContentDisposition != null) {
      // Note: URLSearchParams already decodes percent-encoded values.
      const match = responseContentDisposition.match(
        /filename\*=UTF-8''([^;]+)|filename\s*=\s*"?([^";]+)"?/i
      )
      const filenameCandidate = match?.[1] ?? match?.[2]
      if (filenameCandidate != null && filenameCandidate.trim() !== '') {
        return filenameCandidate.trim()
      }
    }

    // Fall back to the last path segment.
    const lastSegment = url.pathname.split('/').filter(Boolean).pop()
    if (lastSegment != null && lastSegment.trim() !== '') return lastSegment
  } catch {
    // ignore and fall back
  }

  return 'import.json'
}

function inferFallbackTypeFromSignedUrl(signedUrl: string): string | undefined {
  try {
    const url = safeParseSignedUrl(signedUrl)
    const responseContentType = url.searchParams.get('response-content-type')
    if (responseContentType == null || responseContentType.trim() === '') {
      return undefined
    }
    // Note: URLSearchParams already decodes percent-encoded values.
    return responseContentType
  } catch {
    return undefined
  }
}

function getSearchParamFromHash(hash: string, name: string): string | null {
  // Examples:
  // - "#/overview" => no params
  // - "#/overview?src=...&name=..." => parse the query after '?'
  const questionMarkIndex = hash.indexOf('?')
  if (questionMarkIndex < 0) return null

  const queryString = hash.slice(questionMarkIndex + 1)
  return new URLSearchParams(queryString).get(name)
}

export function getImportQueryParam(name: string): string | null {
  const url = new URL(window.location.href)

  const fromSearch = url.searchParams.get(name)
  if (fromSearch != null) return fromSearch

  return getSearchParamFromHash(url.hash, name)
}

export function getImportProtocolQueryParams(): ImportProtocolQueryParams | null {
  const signedUrl = getSignedUrlFromLocation()
  if (signedUrl == null || signedUrl.trim() === '') return null

  const filenameParam = getImportQueryParam(IMPORT_NAME_PARAM)
  const typeParam = getImportQueryParam(IMPORT_TYPE_PARAM)

  const filename =
    filenameParam != null && filenameParam.trim() !== ''
      ? filenameParam
      : inferFilenameFromSignedUrl(signedUrl)
  const fallbackType =
    typeParam != null && typeParam.trim() !== ''
      ? typeParam
      : inferFallbackTypeFromSignedUrl(signedUrl)

  // IMPORTANT: Return the signed URL exactly as provided (or reconstructed from
  // the outer URL). Presigned URL signatures are sensitive to any changes in
  // encoding.
  return { signedUrl, filename, fallbackType }
}

export function stripImportProtocolQueryParams(): void {
  const url = new URL(window.location.href)

  // Remove from search params (before '#')
  url.searchParams.delete(IMPORT_SRC_PARAM)
  url.searchParams.delete(IMPORT_NAME_PARAM)
  url.searchParams.delete(IMPORT_TYPE_PARAM)

  // Remove from hash query (after '#') if present
  const hash = url.hash
  const questionMarkIndex = hash.indexOf('?')
  if (questionMarkIndex >= 0) {
    const baseHash = hash.slice(0, questionMarkIndex)
    const hashQuery = new URLSearchParams(hash.slice(questionMarkIndex + 1))
    hashQuery.delete(IMPORT_SRC_PARAM)
    hashQuery.delete(IMPORT_NAME_PARAM)
    hashQuery.delete(IMPORT_TYPE_PARAM)

    const nextHashQuery = hashQuery.toString()
    url.hash = nextHashQuery.length > 0 ? `${baseHash}?${nextHashQuery}` : baseHash
  }

  window.history.replaceState(null, document.title, url.toString())
}

export function assertAllowedImportUrl(signedUrl: string): void {
  if (signedUrl.trim() === '') {
    throw new Error('Missing signed URL')
  }

  const importUrl = safeParseSignedUrl(signedUrl)

  // Allow same-origin imports (useful for dev / internal proxying).
  if (importUrl.hostname === window.location.hostname) return

  const hostname = importUrl.hostname

  // Allow CloudFront (common for signed distribution URLs).
  if (hostname.endsWith('.cloudfront.net')) return

  // Allow S3 endpoints used by presigned URLs.
  // - Path-style: s3.us-east-2.amazonaws.com/bucket/key
  // - Virtual-hosted style: bucket.s3.us-east-2.amazonaws.com/key
  // - Global: s3.amazonaws.com and bucket.s3.amazonaws.com
  const allowedS3Hosts = new Set(['s3.us-east-2.amazonaws.com', 's3.amazonaws.com'])
  const isAllowedS3Host =
    allowedS3Hosts.has(hostname) ||
    hostname.endsWith('.s3.us-east-2.amazonaws.com') ||
    hostname.endsWith('.s3.amazonaws.com')

  if (isAllowedS3Host) return

  throw new Error(`Disallowed import host: ${hostname}`)
}

function guessContentType(filename: string): string {
  if (filename.endsWith('.json')) return 'application/json'
  if (filename.endsWith('.py')) return 'text/x-python;charset=UTF-8'
  return 'application/octet-stream'
}

export async function loadFileFromSignedUrl(params: {
  signedUrl: string
  filename: string
  fallbackType?: string
}): Promise<File> {
  let res: Response

  // IMPORTANT: Try the URL exactly as provided first. If it contains invalid URL
  // characters (e.g. unescaped quotes), fetch may throw before making a request.
  // Only then do we fall back to a normalized/escaped URL.
  try {
    res = await fetch(params.signedUrl, { method: 'GET' })
  } catch (e) {
    const fallbackUrl = normalizeSignedUrl(params.signedUrl)
    if (fallbackUrl === params.signedUrl) throw e
    res = await fetch(fallbackUrl, { method: 'GET' })
  }

  if (!res.ok) {
    let details = ''
    try {
      const text = await res.text()
      const trimmed = text.trim()
      details = trimmed.length > 0 ? `\n${trimmed.slice(0, 2000)}` : ''
    } catch {
      // ignore
    }
    throw new Error(
      `Failed to fetch file: ${res.status} ${res.statusText}${details}`
    )
  }

  const headerContentType = res.headers.get('content-type')
  const sanitizedHeaderType =
    headerContentType != null && headerContentType.trim() !== ''
      ? headerContentType
      : undefined
  const sanitizedFallbackType =
    params.fallbackType != null && params.fallbackType.trim() !== ''
      ? params.fallbackType
      : undefined

  const contentType =
    sanitizedHeaderType ??
    sanitizedFallbackType ??
    guessContentType(params.filename)

  const blob = await res.blob()
  return new File([blob], params.filename, { type: contentType })
}
