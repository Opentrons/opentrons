import type {
  Mount,
  PipetteData,
  PipetteOffsetCalibration,
  TipLengthCalibration,
} from '@opentrons/api-client'
import type { LabwareDefinition } from '@opentrons/shared-data'

export interface PipetteInformation extends PipetteData {
  displayName: string
}

export interface PipetteCalibrations {
  offset: PipetteOffsetCalibration | null
  tipLength: TipLengthCalibration | null
}

export type PipetteCalibrationsByMount = {
  [mount in Mount]: PipetteCalibrations
}

export interface TipRackCalibrationData {
  displayName: string
  lastModifiedDate: string | null
  tipRackDef: LabwareDefinition
}
