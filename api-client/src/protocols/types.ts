import type { PipetteName } from '@opentrons/shared-data'
import type { ResourceLinks } from '../types'

export interface LoadedPipette {
  id: string
  pipetteName: PipetteName
  mount: 'left' | 'right'
}

export interface LoadedLabware {
  id: string
  loadName: string
  definitionUri: string
  deckSlotLocation: {
    slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  }
}

export interface ProtocolMetadata {
  protocolName?: string
  author?: string
  description?: string | null | undefined
  created?: number
  lastModified?: number | null | undefined
  category?: string | null | undefined
  subcategory?: string | null | undefined
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
  // TODO: replace with v6 Command type after that PR clears
  commands: {}
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

export interface EmptyResponse {
  links?: ResourceLinks
  data: null
}

export interface ErrorDetails {
  id?: 'ProtocolNotFound' | 'ProtocolFileInvalid'
  title?: string
  detail: string
  source?: {
    pointer: string
    parameter: string
    header: string
  }
  meta: ProtocolMetadata
}

export interface ValidationError {
  loc: string[]
  msg: string
  type: string
}

export interface ProtocolFileInvalid {
  id: string
}

export interface ErrorResponse {
  links?: ResourceLinks
  errors: ErrorDetails[]
}

export interface ValidationErrorResponse {
  detail: ValidationError[]
}
