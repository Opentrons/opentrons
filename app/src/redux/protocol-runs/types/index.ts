import type { CameraAction, CameraState } from './camera'
import type { LPCWizardAction, LPCWizardState } from './lpc'
import type { RunSetupStatus, RunSetupStepsAction } from './setup'

export * from './setup'
export * from './lpc'
export * from './camera'

export interface PerRunUIState {
  setup: RunSetupStatus
  camera: CameraState
  lpc?: LPCWizardState
}

export interface ProtocolRunState {
  readonly [runId: string]: PerRunUIState
}

export type ProtocolRunAction =
  | RunSetupStepsAction
  | LPCWizardAction
  | CameraAction
