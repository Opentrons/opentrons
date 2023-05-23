import type { AxiosRequestConfig } from 'axios'
import type { ResponsePromise } from './request'

export interface HostConfig {
  hostname: string
  requestor?: <ResData>(config: AxiosRequestConfig) => ResponsePromise<ResData>
  port?: number | null
  robotName?: string | null
}

export interface ResourceLink {
  href: string
  meta?: Partial<{ [key: string]: string | null | undefined }>
}

export type ResourceLinks = Record<
  string,
  ResourceLink | string | null | undefined
>

export interface ErrorDetails {
  id: string
  title: string
  detail: string
  source?: {
    pointer?: string
    parameter?: string
    header?: string
  }
}

export interface ErrorResponse {
  links?: ResourceLinks
  errors: ErrorDetails[]
}

export interface EmptyResponse {
  links?: ResourceLinks
  data: null
}
