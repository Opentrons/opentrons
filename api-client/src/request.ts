import axios, { AxiosRequestConfig } from 'axios'

import type { Method, AxiosPromise, AxiosResponse } from 'axios'
import type { HostConfig } from './types'

export type ResponsePromise<Data> = AxiosPromise<Data>

export type Response<Data> = AxiosResponse<Data>

export const DEFAULT_PORT = 31950

export const DEFAULT_HEADERS = {
  'Opentrons-Version': '*',
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
  const { hostname, port } = config
  const headers = { ...DEFAULT_HEADERS }
  const baseURL = `http://${hostname}:${port ?? DEFAULT_PORT}`

  return axios.request({ headers, method, baseURL, url, data, params })
}
