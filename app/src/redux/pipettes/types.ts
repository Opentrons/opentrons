import type {
  LabwareDefinition2,
  PipetteChannels,
  PipetteModelSpecs,
} from '@opentrons/shared-data'
import type { RobotApiRequestMeta } from '../robot-api/types'
import type {
  PipetteOffsetCalibration,
  TipLengthCalibration,
} from '../calibration/types'

// common types

export type Mount = 'left' | 'right'

export interface StatePipette {
  // resource ID
  _id: number
  // robot mount instrument is installed on
  mount: Mount
  // number of liquid channels
  channels: PipetteChannels
  // user-given name of the instrument
  // TODO: Ian + Mike 2018-11-06 This `name` is not what we now call the `name`,
  // rather it is the full versioned `model` of the pipette, as placed in the
  // Python Pipette's `name` field by the pipette factory functions.
  // TLDR: this `name` needs to be renamed in a future PR to `model`
  name: string
  // tipracks the pipette uses during the protocol
  // array of RPC object IDs corresponding to `_id` field in StateLabware
  tipRacks: number[]
  // string specified in protocol to load pipette
  requestedAs?: string | null | undefined
}

export interface ProtocolPipette extends StatePipette {
  probed: boolean
  tipOn: boolean
  modelSpecs: PipetteModelSpecs | null
}

export interface AttachedPipette {
  id: string
  name: string
  model: string
  tip_length: number
  mount_axis: string
  plunger_axis: string
  modelSpecs: PipetteModelSpecs
}

export type AttachedPipettesByMount = {
  [mount in Mount]: null | AttachedPipette
}

export interface PipetteSettingsField {
  value: number | null | undefined
  default: number
  min?: number
  max?: number
  units?: string
  type?: string
}

export interface PipetteQuirksField {
  [quirkId: string]: boolean
}

interface QuirksField {
  quirks?: PipetteQuirksField
}
export type PipetteSettingsFieldsMap = QuirksField & {
  [fieldId: string]: PipetteSettingsField
}

export interface PipetteSettings {
  info: { name: string | null | undefined; model: string | null | undefined }
  fields: PipetteSettingsFieldsMap
}

export type PipetteSettingsFieldsUpdate = Partial<{
  [fieldId: string]: number | null
}>

export type PipetteSettingsById = Partial<{ [id: string]: PipetteSettings }>

export interface PipetteSettingsByMount {
  left: PipetteSettingsFieldsMap | null
  right: PipetteSettingsFieldsMap | null
}

export type PipetteCompatibility = 'match' | 'inexact_match' | 'incompatible'

export interface ProtocolPipetteInfo {
  actual:
    | null
    | (AttachedPipette & {
        displayName: string
        modelSpecs: PipetteModelSpecs | null | undefined
      })
  protocol:
    | null
    | (Partial<ProtocolPipette> & {
        displayName: string
      })
  compatibility: PipetteCompatibility
  needsOffsetCalibration: boolean
}

export interface ProtocolPipetteInfoByMount {
  left: ProtocolPipetteInfo
  right: ProtocolPipetteInfo
}

// API response types

export type FetchPipettesResponsePipette =
  | {
      id: string
      name: string
      model: string
      tip_length: number
      mount_axis: string
      plunger_axis: string
    }
  | {
      id: null
      name: null
      model: null
      mount_axis: string
      plunger_axis: string
    }

export interface FetchPipettesResponseBody {
  left: FetchPipettesResponsePipette
  right: FetchPipettesResponsePipette
}

export type FetchPipetteSettingsResponseBody = PipetteSettingsById

// action types

// fetch pipettes

export interface FetchPipettesAction {
  type: 'pipettes:FETCH_PIPETTES'
  payload: { robotName: string; refresh: boolean }
  meta: RobotApiRequestMeta | {}
}

export interface FetchPipettesSuccessAction {
  type: 'pipettes:FETCH_PIPETTES_SUCCESS'
  payload: { robotName: string; pipettes: FetchPipettesResponseBody }
  meta: RobotApiRequestMeta
}

export interface FetchPipettesFailureAction {
  type: 'pipettes:FETCH_PIPETTES_FAILURE'
  payload: { robotName: string; error: {} }
  meta: RobotApiRequestMeta
}

// fetch pipette settings

export interface FetchPipetteSettingsAction {
  type: 'pipettes:FETCH_PIPETTE_SETTINGS'
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchPipetteSettingsSuccessAction {
  type: 'pipettes:FETCH_PIPETTE_SETTINGS_SUCCESS'
  payload: { robotName: string; settings: FetchPipetteSettingsResponseBody }
  meta: RobotApiRequestMeta
}

export interface FetchPipetteSettingsFailureAction {
  type: 'pipettes:FETCH_PIPETTE_SETTINGS_FAILURE'
  payload: { robotName: string; error: {} }
  meta: RobotApiRequestMeta
}

// update pipette settings

export interface UpdatePipetteSettingsAction {
  type: 'pipettes:UPDATE_PIPETTE_SETTINGS'
  payload: {
    robotName: string
    pipetteId: string
    fields: PipetteSettingsFieldsUpdate
  }
  meta: RobotApiRequestMeta | {}
}

export interface UpdatePipetteSettingsSuccessAction {
  type: 'pipettes:UPDATE_PIPETTE_SETTINGS_SUCCESS'
  payload: {
    robotName: string
    pipetteId: string
    fields: PipetteSettingsFieldsMap
  }
  meta: RobotApiRequestMeta
}

export interface UpdatePipetteSettingsFailureAction {
  type: 'pipettes:UPDATE_PIPETTE_SETTINGS_FAILURE'
  payload: { robotName: string; pipetteId: string; error: {} }
  meta: RobotApiRequestMeta
}

// pipette actions unions

export type PipettesAction =
  | FetchPipettesAction
  | FetchPipettesSuccessAction
  | FetchPipettesFailureAction
  | FetchPipetteSettingsAction
  | FetchPipetteSettingsSuccessAction
  | FetchPipetteSettingsFailureAction
  | UpdatePipetteSettingsAction
  | UpdatePipetteSettingsSuccessAction
  | UpdatePipetteSettingsFailureAction

// state types

export interface PerRobotPipettesState {
  readonly attachedByMount: FetchPipettesResponseBody | null
  readonly settingsById: FetchPipetteSettingsResponseBody | null
}

export type PipettesState = Partial<{
  readonly [robotName: string]: null | undefined | PerRobotPipettesState
}>

export interface PipetteCalibrations {
  offset: PipetteOffsetCalibration | null
  tipLength: TipLengthCalibration | null
}

export type PipetteCalibrationsByMount = {
  [mount in Mount]: PipetteCalibrations
}

export type ProtocolPipettesMatchByMount = {
  [mount in Mount]: string | null
}

export interface TipRackCalibrationData {
  displayName: string
  lastModifiedDate: string | null
  tipRackDef: LabwareDefinition2
}

export interface ProtocolPipetteTipRackCalData {
  pipetteDisplayName: string
  exactPipetteMatch: string | null
  pipetteCalDate?: string | null
  tipRacks: TipRackCalibrationData[]
}

export type ProtocolPipetteTipRackCalDataByMount = {
  [mount in Mount]: ProtocolPipetteTipRackCalData | null
}
