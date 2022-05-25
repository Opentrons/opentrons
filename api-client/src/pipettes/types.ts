import type { PipetteModel, PipetteModelSpecs } from '@opentrons/shared-data'

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

// API response types

export type FetchPipettesResponsePipette =
  | {
      id: string
      name: string
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
