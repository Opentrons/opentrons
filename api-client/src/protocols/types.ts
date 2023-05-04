import type { ResourceLinks } from '../types'
import type {
  ProtocolResource,
  PendingProtocolAnalysis,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'

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
  links?: {
    referencingRuns: [
      {
        id: string
        href: string
      }
    ]
  }
  data: ProtocolResource
}

export interface ProtocolAnalyses {
  links?: ResourceLinks
  data: Array<CompletedProtocolAnalysis | PendingProtocolAnalysis>
}

export interface Protocols {
  links?: ResourceLinks
  data: ProtocolResource[]
}
