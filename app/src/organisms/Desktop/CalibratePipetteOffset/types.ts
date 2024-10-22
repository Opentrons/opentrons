import type {
  SessionCommandParams,
  PipetteOffsetCalibrationSession,
  CalibrationLabware,
} from '/app/redux/sessions/types'

import type { PipetteOffsetCalibrationStep } from '/app/redux/sessions/pipette-offset-calibration/types'
import type { DispatchRequestsType } from '/app/redux/robot-api'

export interface CalibratePipetteOffsetParentProps {
  robotName: string
  session: PipetteOffsetCalibrationSession | null
  dispatchRequests: DispatchRequestsType
  requestIds: string[]
  showSpinner: boolean
  isJogging: boolean
}

export interface CalibratePipetteOffsetChildProps {
  sendSessionCommands: (...params: SessionCommandParams[]) => void
  deleteSession: () => void
  tipRack: CalibrationLabware
  isMulti: boolean
  mount: string
  currentStep: PipetteOffsetCalibrationStep
}
