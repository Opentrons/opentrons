import type { INCOMPATIBLE, MATCH } from './constants'

export type PipetteCompatibility = typeof MATCH | typeof INCOMPATIBLE

export interface PipetteInfo {
  requestedPipetteMatch: PipetteCompatibility
}
