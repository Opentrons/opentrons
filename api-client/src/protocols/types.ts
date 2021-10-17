import type { ResourceLinks } from '../types'

export interface ProtocolAnalysis {
  id: string
  status: string
}

export interface ProtocolMetadata {
  protocolName: string
  description: string
  created: number
  category: any
  author: string
  lastModified: number
  subcategory: string | null
  tags: any[]
}

export interface ProtocolData {
  id: string
  createdAt: string
  protocolType: string
  metadata: ProtocolMetadata
  analyses: any[]
}

export interface Protocol {
  links: ResourceLinks
  data: ProtocolData | null
}

export interface Protocols {
  links: ResourceLinks
  data: ProtocolData[] | null
}
