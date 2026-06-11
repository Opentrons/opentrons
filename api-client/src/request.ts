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

export type BrandedAxiosConfig = AxiosRequestConfig & {
  readonly __axiosConfigBrand: unique symbol
}
export function createAxiosConfig(
  config: AxiosRequestConfig
): BrandedAxiosConfig {
  return config as BrandedAxiosConfig
}

export function request<ResData, ReqData = null>(
  method: Method,
  url: string,
  data: ReqData,
  hostConfig: HostConfig,
  axiosConfig?: BrandedAxiosConfig,
  userNotes?: string
): ResponsePromise<ResData> {
  const {
    hostname,
    port,
    requestor = (...args) => Axios.request(...args),
    token,
    secure,
  } = hostConfig

  const tokenHeader = token != null ? { Authorization: `Bearer ${token}` } : {}
  const userNotesHeader =
    userNotes != null ? { 'Opentrons-User-Notes': userNotes } : {}
  const headers = {
    ...DEFAULT_HEADERS,
    ...tokenHeader,
    ...userNotesHeader,
    ...axiosConfig?.headers,
  }

  const protocol = (secure ?? false) ? 'https' : 'http'
  const defaultPort = (secure ?? false) ? DEFAULT_HTTPS_PORT : DEFAULT_PORT

  const baseURL = `${protocol}://${hostname}:${port ?? defaultPort}`

  return requestor<ResData>({
    method,
    baseURL,
    url,
    data,
    ...axiosConfig,
    headers,
  })
}
