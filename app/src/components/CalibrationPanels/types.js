// @flow
import type {
  SessionCommandString,
  SessionCommandData,
  SessionType,
} from '../../sessions/types'
import type {
  RobotCalibrationCheckLabware,
  RobotCalibrationCheckStep,
} from '../../sessions/calibration-check/types'
import type {
  DeckCalibrationLabware,
  DeckCalibrationStep,
} from '../../sessions/deck-calibration/types'
import type {
  PipetteOffsetCalibrationLabware,
  PipetteOffsetCalibrationStep,
} from '../../sessions/pipette-offset-calibration/types'
import type {
  TipLengthCalibrationLabware,
  TipLengthCalibrationStep,
} from '../../sessions/tip-length-calibration/types'

export type CalibrationPanelProps = {|
  sendSessionCommand: (
    command: SessionCommandString,
    data?: SessionCommandData,
    loadingSpinner?: boolean
  ) => void,
  deleteSession: () => void,
  tipRack:
    | RobotCalibrationCheckLabware
    | DeckCalibrationLabware
    | PipetteOffsetCalibrationLabware
    | TipLengthCalibrationLabware,
  isMulti: boolean,
  mount: string,
  currentStep:
    | RobotCalibrationCheckStep
    | DeckCalibrationStep
    | PipetteOffsetCalibrationStep
    | TipLengthCalibrationStep,
  sessionType: SessionType,
|}
