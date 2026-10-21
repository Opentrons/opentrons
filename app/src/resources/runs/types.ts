import type { INCOMPATIBLE, INEXACT_MATCH, MATCH } from './constants'

export type PipetteCompatibility =
  typeof MATCH | typeof INEXACT_MATCH | typeof INCOMPATIBLE

export interface PipetteInfo {
  requestedPipetteMatch: PipetteCompatibility
}
