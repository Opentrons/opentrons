// @flow
import type {
  SessionCommandParams,
  SessionType,
  CalibrationSessionStep,
} from '../../sessions/types'
import type { DeckCalibrationLabware } from '../../sessions/deck-calibration/types'
import type { PipetteOffsetCalibrationLabware } from '../../sessions/pipette-offset-calibration/types'
import type { TipLengthCalibrationLabware } from '../../sessions/tip-length-calibration/types'

export type CalibrationPanelProps = {|
  sendCommands: (...Array<SessionCommandParams>) => void,
  cleanUpAndExit: () => void,
  tipRack:
    | DeckCalibrationLabware
    | PipetteOffsetCalibrationLabware
    | TipLengthCalibrationLabware,
  isMulti: boolean,
  mount: string,
  currentStep: CalibrationSessionStep,
  sessionType: SessionType,
  calBlock?:
    | PipetteOffsetCalibrationLabware
    | TipLengthCalibrationLabware
    | null,
|}
