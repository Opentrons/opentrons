import type { PipetteNameSpecs } from '@opentrons/shared-data'
import type { TipRackCalibrationData } from '/app/resources/instruments/types'
import type { INCOMPATIBLE, INEXACT_MATCH, MATCH } from './constants'

export type PipetteCompatibility =
  | typeof MATCH
  | typeof INEXACT_MATCH
  | typeof INCOMPATIBLE

export interface PipetteInfo {
  pipetteSpecs: PipetteNameSpecs
  tipRacksForPipette: TipRackCalibrationData[]
  requestedPipetteMatch: PipetteCompatibility
  pipetteCalDate: string | null
}
