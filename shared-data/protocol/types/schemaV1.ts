import type { DeckSlotId, PipetteMount as Mount } from '../../js/types'

// COMMANDS
export interface PipetteLabwareFields {
  pipette: string
  labware: string
  well: string
}

export interface AspirateDispenseArgs extends PipetteLabwareFields {
  volume: number
  offsetFromBottomMm?: number | null
  'flow-rate'?: number | null
}

export type Command =
  | {
      command: 'aspirate' | 'dispense'
      params: AspirateDispenseArgs
    }
  | {
      command: 'pick-up-tip' | 'drop-tip' | 'blowout'
      params: PipetteLabwareFields
    }
  | {
      command: 'touch-tip'
      params: PipetteLabwareFields & {
        offsetFromBottomMm?: number | null
      }
    }
  | {
      command: 'delay'

      /** number of seconds to delay (fractional values OK),
  or `true` for delay until user input */
      params: {
        wait: number | true
        message: string | null | undefined
      }
    }
  | {
      command: 'air-gap'
      params: {
        pipette: string
        volume: number
      }
    }

// File Subtypes
type VersionString = string // eg '1.0.0'

// NOTE: these are an enum type in the spec, but it's inconvenient to flow-type them.
type PipetteModel = string
type PipetteName = string

export interface FilePipette {
  mount: Mount
  model: PipetteModel
  name?: PipetteName
}

export interface FileLabware {
  slot: DeckSlotId
  model: string
  'display-name'?: string
}

type FlowRateForPipettes = Record<PipetteModel, number>

// A v1 JSON protocol file
export interface ProtocolFile<DesignerApplicationData> {
  'protocol-schema': VersionString
  metadata: {
    'protocol-name'?: string
    author?: string
    description?: string
    created?: number
    'last-modified'?: number | null
    category?: string | null
    subcategory?: string | null
    tags?: string[]
  }
  'default-values': {
    'aspirate-flow-rate': FlowRateForPipettes
    'dispense-flow-rate': FlowRateForPipettes
    'aspirate-mm-from-bottom': number
    'dispense-mm-from-bottom': number
    'touch-tip-mm-from-top'?: number
  }
  // TODO(mc, 2019-04-17): this key isn't marked required in JSON schema
  'designer-application': {
    'application-name': string
    'application-version': string | null | undefined
    data: DesignerApplicationData
  }
  robot: {
    model: 'OT-2 Standard'
  }
  pipettes: Record<string, FilePipette>
  labware: Record<string, FileLabware>
  procedure: Array<{
    annotation: {
      name: string
      description: string
    }
    subprocedure: Command[]
  }>
}
