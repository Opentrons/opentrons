// @flow
import type { Mount } from '@opentrons/components'
import type { DeckSlotId, LabwareDefinition2 } from '@opentrons/shared-data'

// NOTE: this is an enum type in the spec, but it's inconvenient to flow-type them.
type PipetteName = string

export type FilePipette = {|
  mount: Mount,
  name: PipetteName,
|}

export type FileLabware = {|
  slot: DeckSlotId,
  definitionId: string,
  displayName?: string,
|}

type FlowRateParams = {| flowRate: number |}

export type PipetteAccessParams = {|
  pipette: string,
  labware: string,
  well: string,
|}

type VolumeParams = {| volume: number |}

type OffsetParams = {| offsetFromBottomMm: number |}

export type _AspDispAirgapParams = {|
  ...FlowRateParams,
  ...PipetteAccessParams,
  ...VolumeParams,
  ...OffsetParams,
|}

export type AspirateParams = _AspDispAirgapParams
export type DispenseParams = _AspDispAirgapParams
export type AirGapParams = _AspDispAirgapParams

export type BlowoutParams = {|
  ...FlowRateParams,
  ...PipetteAccessParams,
  ...OffsetParams,
|}

export type TouchTipParams = {|
  ...PipetteAccessParams,
  ...OffsetParams,
|}

export type PickUpTipParams = PipetteAccessParams
export type DropTipParams = PipetteAccessParams

export type MoveToSlotParams = {|
  pipette: string,
  slot: string,
  offset?: {|
    x: number,
    y: number,
    z: number,
  |},
  minimumZHeight?: number,
  forceDirect?: boolean,
|}

export type DelayParams = {|
  wait: number | true,
  message?: string,
|}

export type Command =
  | {|
      command: 'aspirate' | 'dispense' | 'airGap',
      params: _AspDispAirgapParams,
    |}
  | {|
      command: 'blowout',
      params: BlowoutParams,
    |}
  | {|
      command: 'touchTip',
      params: TouchTipParams,
    |}
  | {|
      command: 'pickUpTip' | 'dropTip',
      params: PipetteAccessParams,
    |}
  | {|
      command: 'moveToSlot',
      params: MoveToSlotParams,
    |}
  | {|
      command: 'delay',
      params: DelayParams,
    |}

// NOTE: must be kept in sync with '../schemas/3.json'
export type ProtocolFile<DesignerApplicationData> = {|
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
    [pipetteId: string]: FilePipette,
  },
  labwareDefinitions: {
    [labwareDefId: string]: LabwareDefinition2,
  },
  labware: {
    [labwareInstanceId: string]: {|
      slot: string,
      definitionId: string,
      displayName?: string,
    |},
  },
  commands: Array<Command>,
  commandAnnotations?: Object, // NOTE: intentionally underspecified b/c we haven't decided on this yet
|}
