import type {
  SessionCommandParams,
  PipetteOffsetCalibrationSession,
  CalibrationLabware,
} from '../../redux/sessions/types'
import type { PipetteOffsetIntent } from '../../organisms/CalibrationPanels/types'

import type { PipetteOffsetCalibrationStep } from '../../redux/sessions/pipette-offset-calibration/types'
import { DispatchRequestsType } from '../../redux/robot-api'

export interface CalibratePipetteOffsetParentProps {
  robotName: string
  session: PipetteOffsetCalibrationSession | null
  dispatchRequests: DispatchRequestsType
  showSpinner: boolean
  isJogging: boolean
  intent: PipetteOffsetIntent
}

export interface CalibratePipetteOffsetChildProps {
  sendSessionCommands: (...params: SessionCommandParams[]) => void
  deleteSession: () => void
  tipRack: CalibrationLabware
  isMulti: boolean
  mount: string
  currentStep: PipetteOffsetCalibrationStep
}
