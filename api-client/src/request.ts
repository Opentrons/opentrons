import Axios from 'axios'

import type {
  AxiosPromise,
  AxiosRequestConfig,
  AxiosResponse,
  Method,
} from 'axios'
import type { HostConfig } from './types'

export type ResponsePromise<Data> = AxiosPromise<Data>

export type Response<Data> = AxiosResponse<Data>

export const DEFAULT_PORT = 31950
export const DEFAULT_HTTPS_PORT = 32313

export const DEFAULT_HEADERS = {
  'Opentrons-Version': '3',
}

export const GET = 'GET'
export const POST = 'POST'
export const PATCH = 'PATCH'
export const DELETE = 'DELETE'
export const PUT = 'PUT'

export interface RequestConfig<
  RequestBodyT extends AxiosRequestConfig['data'],
> {
  /**
   * The request body.
   */
  body?: RequestBodyT

  /**
   * Query parameters, e.g. {foo: "bar"} for ?foo=bar.
   */
  queryParams?: Record<string, string | number | boolean>

  /**
   * Request-specific headers.
   *
   * Common headers like Authorization, Opentrons-Version,
   * and Opentrons-User-Notes don't need to be set here;
   * they'll be added automatically.
   */
  headers?: Record<string, string>

  /**
   * The user-entered reason for this interaction with the robot.
   * Generally required by the server for any mutation when
   * Compliance Ready Software is enabled.
   */
  userNotes?: string

  /**
   * What kind of response body to expect and how Axios should parse it.
   */
  responseType?: AxiosRequestConfig['responseType']

  /**
   * If true, this request will always use HTTPS, never HTTP.
   * (Unless it's to localhost, in which case it may still use HTTP.)
   *
   * This must be set to true whenever a request carries secrets. For example, if
   * the request is to change a user's password, this needs to be true to avoid
   * exposing the new password over the network.
   *
   * This should otherwise be set to false because HTTPS requires some onerous manual
   * setup, and so not every robot will support it.
   */
  requiresSecureTransport?: boolean
}

export function request<
  ResponseBodyT,
  RequestBodyT extends AxiosRequestConfig['data'] = never,
>(
  method: Method,
  url: string,
  hostConfig: HostConfig,
  requestConfig?: RequestConfig<RequestBodyT>
): ResponsePromise<ResponseBodyT> {
  const {
    hostname,
    port,
    requestor = (...args) => Axios.request(...args),
    token,
    secure,
  } = hostConfig

  const params = requestConfig?.queryParams ?? {}
  const tokenHeader = token != null ? { Authorization: `Bearer ${token}` } : {}
  const userNotesHeader =
    requestConfig?.userNotes != null
      ? { 'Opentrons-User-Notes': requestConfig.userNotes }
      : {}
  const extraHeaders = requestConfig?.headers ?? {}
  const headers = {
    ...DEFAULT_HEADERS,
    ...tokenHeader,
    ...userNotesHeader,
    ...extraHeaders,
  }

  const requiresSecureTransport =
    'Authorization' in headers ||
    (requestConfig?.requiresSecureTransport ?? false)

  const protocol =
    (secure ?? false) || (requiresSecureTransport && !isLocalhost(hostConfig))
      ? 'https'
      : 'http'
  const defaultPort = protocol === 'https' ? DEFAULT_HTTPS_PORT : DEFAULT_PORT

  const portToUse = port
    ? port === DEFAULT_PORT && protocol === 'https'
      ? DEFAULT_HTTPS_PORT
      : port
    : defaultPort

  const baseURL = `${protocol}://${hostname}:${portToUse}`

  return requestor<ResponseBodyT>({
    method,
    baseURL,
    url,
    params,
    data: requestConfig?.body,
    headers,
    responseType: requestConfig?.responseType,
  })
}

function isLocalhost(hostConfig: HostConfig): boolean {
  return (
    hostConfig.hostname === 'localhost' ||
    hostConfig.hostname === '127.0.0.1' ||
    hostConfig.hostname === '::1'
  )
}
