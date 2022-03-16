export interface HostConfig {
  hostname: string
  port?: number | null
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
