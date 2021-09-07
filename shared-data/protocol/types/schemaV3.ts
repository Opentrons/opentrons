import { PipetteName } from '../../js'
import type {
  DeckSlotId,
  LabwareDefinition2,
  PipetteMount as Mount,
} from '../../js/types'

// NOTE: this is an enum type in the spec, but it's inconvenient to flow-type them.
// type PipetteName = string

export interface FilePipette {
  mount: Mount
  name: PipetteName
}

export interface FileLabware {
  slot: DeckSlotId
  definitionId: string
  displayName?: string
}

interface FlowRateParams {
  flowRate: number
}

export interface PipetteAccessParams {
  pipette: string
  labware: string
  well: string
}

interface VolumeParams {
  volume: number
}

interface OffsetParams {
  offsetFromBottomMm: number
}

export type AspDispAirgapParams = FlowRateParams &
  PipetteAccessParams &
  VolumeParams &
  OffsetParams

export type AspirateParams = AspDispAirgapParams
export type DispenseParams = AspDispAirgapParams
export type AirGapParams = AspDispAirgapParams
export type BlowoutParams = FlowRateParams & PipetteAccessParams & OffsetParams
export type TouchTipParams = PipetteAccessParams & OffsetParams
export type PickUpTipParams = PipetteAccessParams
export type DropTipParams = PipetteAccessParams

export interface MoveToSlotParams {
  pipette: string
  slot: string
  offset?: {
    x: number
    y: number
    z: number
  }
  minimumZHeight?: number
  forceDirect?: boolean
}

export interface DelayParams {
  wait: number | true
  message?: string
}

export type Command =
  | {
      command: 'aspirate' | 'dispense' | 'airGap'
      params: AspDispAirgapParams
    }
  | {
      command: 'blowout'
      params: BlowoutParams
    }
  | {
      command: 'touchTip'
      params: TouchTipParams
    }
  | {
      command: 'pickUpTip' | 'dropTip'
      params: PipetteAccessParams
    }
  | {
      command: 'moveToSlot'
      params: MoveToSlotParams
    }
  | {
      command: 'delay'
      params: DelayParams
    }

// NOTE: must be kept in sync with '../schemas/3.json'
export interface ProtocolFile<DesignerApplicationData> {
  schemaVersion: 3
  metadata: {
    protocolName?: string
    author?: string
    description?: string | null | undefined
    created?: number
    lastModified?: number | null | undefined
    category?: string | null | undefined
    subcategory?: string | null | undefined
    tags?: string[]
  }
  designerApplication?: {
    name?: string
    version?: string
    data?: DesignerApplicationData
  }
  robot: {
    model: 'OT-2 Standard'
  }
  pipettes: Record<string, FilePipette>
  labwareDefinitions: Record<string, LabwareDefinition2>
  labware: Record<
    string,
    {
      slot: string
      definitionId: string
      displayName?: string
    }
  >
  commands: Command[]
  commandAnnotations?: Record<string, any> // NOTE: intentionally underspecified b/c we haven't decided on this yet
}
