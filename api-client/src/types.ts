export interface HostConfig {
  hostname: string
  port?: number | null
}

interface ResourceLink {
  href: string
  meta?: Partial<{ [key: string]: string | null | undefined }>
}

export type ResourceLinks = Record<
  string,
  ResourceLink | string | null | undefined
>
