import axios, { AxiosRequestConfig } from 'axios'

import type { Method, AxiosPromise, AxiosResponse } from 'axios'
import type { HostConfig } from './types'

export type ResponsePromise<Data> = AxiosPromise<Data>

export type Response<Data> = AxiosResponse<Data>

export const DEFAULT_PORT = 31950

export const DEFAULT_HEADERS = {
  'Opentrons-Version': '3',
}

export const GET = 'GET'
export const POST = 'POST'
export const PATCH = 'PATCH'
export const DELETE = 'DELETE'

export function request<ResData, ReqData = null>(
  method: Method,
  url: string,
  data: ReqData,
  config: HostConfig,
  params?: AxiosRequestConfig['params']
): ResponsePromise<ResData> {
  const { hostname, port, requestor = axios.request, token } = config

  const tokenHeader = token != null ? { authenticationBearer: token } : {}
  const headers = { ...DEFAULT_HEADERS, ...tokenHeader }

  const baseURL = `http://${hostname}:${port ?? DEFAULT_PORT}`

  return requestor<ResData>({ headers, method, baseURL, url, data, params })
}
