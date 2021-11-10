import type { ProtocolResource } from '@opentrons/shared-data'
import type { ResourceLinks, ErrorDetails } from '../types'

export interface ProtocolMetadata {
  protocolName?: string
  author?: string
  description?: string | null
  created?: number
  lastModified?: number | null
  category?: string | null
  subcategory?: string | null
  tags?: string[]
  [key: string]: unknown
}

export interface Protocol {
  links?: ResourceLinks
  data: ProtocolResource
}

export interface Protocols {
  links?: ResourceLinks
  data: ProtocolResource[]
}

export interface ProtocolFileInvalid extends ErrorDetails {
  id: 'ProtocolFileInvalid'
  meta: ProtocolMetadata
}

export interface ProtocolNotFound extends ErrorDetails {
  id: 'ProtocolNotFound'
  meta: ProtocolMetadata
}
