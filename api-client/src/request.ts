import type { HostConfig } from './types'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
export type HttpHeaders = Record<string, string>
export type HttpResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer'
export type HttpRequestParams = object | URLSearchParams

export interface HttpRequestConfig<Data = unknown> {
  baseURL?: string
  data?: Data
  headers?: HttpHeaders
  method?: HttpMethod
  params?: HttpRequestParams
  responseType?: HttpResponseType
  timeout?: number
  url?: string
}

export interface HttpResponse<Data> {
  config: HttpRequestConfig
  data: Data
  headers: HttpHeaders
  status: number
  statusText: string
}

export class HttpClientError<Data = unknown> extends Error {
  public readonly code?: string
  public readonly config: HttpRequestConfig
  public readonly request?: unknown
  public readonly response?: HttpResponse<Data>
  public readonly status?: number
  public readonly cause?: unknown
  public readonly isHttpClientError = true

  public constructor(params: {
    message: string
    config: HttpRequestConfig
    code?: string
    request?: unknown
    response?: HttpResponse<Data>
    cause?: unknown
  }) {
    const { message, config, code, request, response, cause } = params
    super(message)
    this.name = 'HttpClientError'
    this.config = config
    this.code = code
    this.request = request
    this.response = response
    this.status = response?.status
    this.cause = cause
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      config: this.config,
      request: this.request,
      response: this.response,
      isHttpClientError: this.isHttpClientError,
    }
  }
}

export type ResponsePromise<Data> = Promise<HttpResponse<Data>>
export type Response<Data> = HttpResponse<Data>
export type AxiosRequestConfig<Data = unknown> = HttpRequestConfig<Data>
export type AxiosResponse<Data> = HttpResponse<Data>
export type AxiosError<Data = unknown> = HttpClientError<Data>
export type AxiosPromise<Data> = ResponsePromise<Data>
export type Method = HttpMethod

export const DEFAULT_PORT = 31950

export const DEFAULT_HEADERS = {
  'Opentrons-Version': '3',
}

export const GET = 'GET'
export const POST = 'POST'
export const PATCH = 'PATCH'
export const DELETE = 'DELETE'
export const PUT = 'PUT'

export function createRequestConfig<Data = unknown>(
  config: HttpRequestConfig<Data>
): HttpRequestConfig<Data> {
  return config
}

export function isHttpClientError<Data = unknown>(
  error: unknown
): error is HttpClientError<Data> {
  return (
    error instanceof HttpClientError ||
    (typeof error === 'object' &&
      error != null &&
      (error as { isHttpClientError?: unknown }).isHttpClientError === true)
  )
}

export function serializeHttpClientError(
  error: unknown
): Record<string, unknown> {
  if (isHttpClientError(error)) {
    return error.toJSON()
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    }
  }
  return { message: String(error) }
}

function normalizeHeaders(headers: Headers): HttpHeaders {
  return Object.fromEntries(headers.entries())
}

function joinURL(baseURL: string | undefined, url: string): string {
  if (baseURL == null || /^https?:\/\//.test(url)) {
    return url
  }
  return `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
}

function appendQueryParams(
  rawUrl: string,
  params: HttpRequestParams | undefined
): string {
  if (params == null) {
    return rawUrl
  }

  const url = new URL(rawUrl, 'http://placeholder')
  const searchParams =
    params instanceof URLSearchParams
      ? new URLSearchParams(params)
      : new URLSearchParams(url.search)

  if (!(params instanceof URLSearchParams)) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) {
        return
      }
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item !== undefined) {
            searchParams.append(key, String(item))
          }
        })
        return
      }
      if (value != null && typeof value === 'object') {
        return
      }
      searchParams.append(key, String(value))
    })
  }

  url.search = searchParams.toString()
  return rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? url.toString()
    : `${url.pathname}${url.search}`
}

function shouldEncodeJsonBody(data: unknown): boolean {
  return (
    data != null &&
    !(data instanceof FormData) &&
    !(data instanceof URLSearchParams) &&
    !(data instanceof Blob) &&
    typeof data !== 'string' &&
    !(data instanceof ArrayBuffer)
  )
}

async function parseResponseBody<Data>(
  response: globalThis.Response,
  responseType: HttpResponseType | undefined
): Promise<Data> {
  if (response.status === 204 || response.status === 205) {
    return undefined as Data
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (responseType === 'blob') {
    return (await response.blob()) as Data
  }
  if (responseType === 'arrayBuffer') {
    return (await response.arrayBuffer()) as Data
  }
  if (responseType === 'text') {
    return (await response.text()) as Data
  }
  if (
    responseType === 'json' ||
    contentType.includes('application/json') ||
    contentType.includes('+json')
  ) {
    return (await response.json()) as Data
  }

  const text = await response.text()
  return text as Data
}

export async function request<ResData, ReqData = null>(
  method: HttpMethod,
  url: string,
  data: ReqData,
  config: HostConfig,
  requestConfig?: HttpRequestConfig
): ResponsePromise<ResData> {
  const {
    hostname,
    port,
    requestor,
    token,
  } = config

  const tokenHeader: HttpHeaders =
    token != null ? { authenticationBearer: token } : {}
  const headers: HttpHeaders = {
    ...DEFAULT_HEADERS,
    ...tokenHeader,
    ...requestConfig?.headers,
  }
  const baseURL = `http://${hostname}:${port ?? DEFAULT_PORT}`
  const mergedConfig: HttpRequestConfig = {
    baseURL,
    data,
    headers,
    method,
    ...requestConfig,
    url,
  }

  if (requestor != null) {
    return await requestor<ResData>(mergedConfig)
  }

  const requestUrl = appendQueryParams(joinURL(baseURL, url), mergedConfig.params)
  const controller = new AbortController()
  const timeoutId =
    mergedConfig.timeout != null
      ? setTimeout(() => {
          controller.abort()
        }, mergedConfig.timeout)
      : null

  try {
    const body =
      shouldEncodeJsonBody(mergedConfig.data) &&
      !('Content-Type' in headers) &&
      !('content-type' in headers)
        ? JSON.stringify(mergedConfig.data)
        : mergedConfig.data

    const response = await fetch(requestUrl, {
      method: mergedConfig.method,
      headers:
        shouldEncodeJsonBody(mergedConfig.data) &&
        !('Content-Type' in headers) &&
        !('content-type' in headers)
          ? { ...headers, 'Content-Type': 'application/json' }
          : headers,
      body: body as BodyInit | null | undefined,
      signal: controller.signal,
    })

    const normalizedResponse: HttpResponse<ResData> = {
      config: mergedConfig,
      data: await parseResponseBody<ResData>(
        response,
        mergedConfig.responseType
      ),
      headers: normalizeHeaders(response.headers),
      status: response.status,
      statusText: response.statusText,
    }

    if (!response.ok) {
      throw new HttpClientError<ResData>({
        message: `Request failed with status code ${response.status}`,
        config: mergedConfig,
        response: normalizedResponse,
      })
    }

    return normalizedResponse
  } catch (error: unknown) {
    if (isHttpClientError(error)) {
      throw error
    }

    const code =
      controller.signal.aborted && mergedConfig.timeout != null
        ? 'ETIMEDOUT'
        : undefined
    const message =
      code === 'ETIMEDOUT'
        ? `timeout of ${mergedConfig.timeout}ms exceeded`
        : error instanceof Error
          ? error.message
          : 'Network request failed'

    throw new HttpClientError<ResData>({
      message,
      code,
      config: mergedConfig,
      cause: error,
    })
  } finally {
    if (timeoutId != null) {
      clearTimeout(timeoutId)
    }
  }
}
