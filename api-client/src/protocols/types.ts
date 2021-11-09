import type { PipetteName, Command } from '@opentrons/shared-data'
import type { ResourceLinks, ErrorDetails } from '../types'

export interface LoadedPipette {
  id: string
  pipetteName: PipetteName
  mount: 'left' | 'right'
}

export interface LoadedLabware {
  id: string
  loadName: string
  definitionUri: string
  location: {
    slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  }
}

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

export interface PendingProtocolAnalysis {
  id: string
  status?: 'pending'
}

export interface CompletedProtocolAnalysis {
  id: string
  status?: 'completed'
  result: 'ok' | 'not-ok' | 'error'
  pipettes: LoadedPipette[]
  labware: LoadedLabware[]
  commands: Command[]
  errors: string[]
}

export interface ProtocolData {
  id: string
  createdAt: string
  protocolType: 'json' | 'python'
  metadata: ProtocolMetadata
  analyses: PendingProtocolAnalysis | CompletedProtocolAnalysis
}

export interface Protocol {
  links?: ResourceLinks
  data: ProtocolData
}

export interface Protocols {
  links?: ResourceLinks
  data: ProtocolData[]
}

export interface ProtocolFileInvalid extends ErrorDetails {
  id: 'ProtocolFileInvalid'
  meta: ProtocolMetadata
}

export interface ProtocolNotFound extends ErrorDetails {
  id: 'ProtocolNotFound'
  meta: ProtocolMetadata
}
