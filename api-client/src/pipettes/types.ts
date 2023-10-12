import type {
  PipetteModel,
  PipetteModelSpecs,
  PipetteName,
} from '@opentrons/shared-data'

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

export type Pipettes = FetchPipettesResponseBody

export interface GetPipettesParams {
  refresh?: boolean
}
// API response types

export type FetchPipettesResponsePipette =
  | {
      id: string
      name: PipetteName
      model: PipetteModel
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

export interface PipetteSettingsField {
  value: number | null | boolean | undefined
  default: number
  min?: number
  max?: number
  units?: string
  type?: string
}
interface PipetteQuirksField {
  [quirkId: string]: boolean
}

interface QuirksField {
  quirks?: PipetteQuirksField
}
export type PipetteSettingsFieldsMap = QuirksField & {
  [fieldId: string]: PipetteSettingsField
}
export interface IndividualPipetteSettings {
  info: { name: string | null | undefined; model: string | null | undefined }
  fields: PipetteSettingsFieldsMap
}

type PipetteSettingsById = Partial<{ [id: string]: IndividualPipetteSettings }>

export type PipetteSettings = PipetteSettingsById

export interface PipetteSettingsUpdateFieldsMap {
  [fieldId: string]: PipetteSettingsUpdateField
}

export type PipetteSettingsUpdateField = {
  value: PipetteSettingsField['value']
} | null

export interface UpdatePipetteSettingsData {
  fields: { [fieldId: string]: PipetteSettingsUpdateField }
}
