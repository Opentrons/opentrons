// @flow
import type { Mount } from '@opentrons/components'
import type { DeckSlotId, LabwareDefinition2 } from '@opentrons/shared-data'

// NOTE: this is an enum type in the spec, but it's inconvenient to flow-type them.
type PipetteName = string

export type FilePipetteV3 = {
  mount: Mount,
  name: PipetteName,
}

export type FileLabwareV3 = {
  slot: DeckSlotId,
  definitionId: string,
  displayName?: string,
}

type FlowRateParams = {| flowRate: number |}

type PipetteAccessParams = {| pipette: string, labware: string, well: string |}

type VolumeParams = {| volume: number |}

type OffsetParams = {| offsetFromBottomMm: number |}

type _AspDispAirgapParams = {|
  ...FlowRateParams,
  ...PipetteAccessParams,
  ...VolumeParams,
  ...OffsetParams,
|}

export type AspirateParamsV3 = _AspDispAirgapParams
export type DispenseParamsV3 = _AspDispAirgapParams
export type AirGapParamsV3 = _AspDispAirgapParams

export type BlowoutParamsV3 = {|
  ...FlowRateParams,
  ...PipetteAccessParams,
  ...OffsetParams,
|}

export type TouchTipParamsV3 = {|
  ...PipetteAccessParams,
  ...OffsetParams,
|}

export type PickUpTipParamsV3 = PipetteAccessParams
export type DropTipParamsV3 = PipetteAccessParams

export type MoveToSlotParamsV3 = {|
  pipette: string,
  slot: string,
  offset?: {|
    x: number,
    y: number,
    z: number,
  |},
  minimumZHeight: number,
|}

export type DelayParamsV3 = {|
  wait: number | true,
  message?: string,
|}

export type CommandV3 =
  | {|
      command: 'aspirate' | 'dispense' | 'airGap',
      params: _AspDispAirgapParams,
    |}
  | {|
      command: 'blowout',
      params: BlowoutParamsV3,
    |}
  | {|
      command: 'touchTip',
      params: TouchTipParamsV3,
    |}
  | {|
      command: 'pickUpTip' | 'dropTip',
      params: PipetteAccessParams,
    |}
  | {|
      command: 'moveToSlot',
      params: MoveToSlotParamsV3,
    |}
  | {|
      command: 'delay',
      params: DelayParamsV3,
    |}

// NOTE: must be kept in sync with '../schemas/3.json'
export type SchemaV3ProtocolFile<DesignerApplicationData> = {|
  schemaVersion: 3,
  metadata: {
    protocolName?: string,
    author?: string,
    description?: ?string,
    created?: number,
    lastModified?: ?number,
    category?: ?string,
    subcategory?: ?string,
    tags?: Array<string>,
  },
  designerApplication?: {
    name?: string,
    version?: string,
    data?: DesignerApplicationData,
  },
  robot: {
    model: 'OT-2 Standard',
  },
  pipettes: {
    [pipetteId: string]: FilePipetteV3,
  },
  labwareDefinitions: {
    [labwareDefId: string]: LabwareDefinition2,
  },
  labware: {
    [labwareInstanceId: string]: {
      slot: string,
      definitionId: string,
      displayName?: string,
    },
  },
  commands: Array<CommandV3>,
  commandAnnotations?: Object, // NOTE: intentionally underspecified b/c we haven't decided on this yet
|}
