import type { INCOMPATIBLE, MATCH } from './constants'

export type PipetteCompatibility = typeof MATCH | typeof INCOMPATIBLE

export interface PipetteInfo {
  requestedPipetteMatch: PipetteCompatibility
}

export interface ProtocolCalibrationStatus {
  complete: boolean
  reason?:
    | 'calibrate_deck_failure_reason'
    | 'calibrate_tiprack_failure_reason'
    | 'calibrate_pipette_failure_reason'
    | 'calibrate_gripper_failure_reason'
    | 'calibrate_module_failure_reason'
    | 'attach_pipette_failure_reason'
    | 'attach_gripper_failure_reason'
}
