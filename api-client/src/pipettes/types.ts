import type { PipetteModelSpecs } from '@opentrons/shared-data'

// common types

export type Mount = 'left' | 'right'

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

// state types

export interface PerRobotPipettesState {
  readonly attachedByMount: FetchPipettesResponseBody | null
  readonly settingsById: FetchPipetteSettingsResponseBody | null
}

export type PipettesState = Partial<{
  readonly [robotName: string]: null | undefined | PerRobotPipettesState
}>
