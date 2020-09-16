// @flow
import type {
  SessionCommandString,
  SessionCommandData,
  SessionCommandParams,
  PipetteOffsetCalibrationSession,
} from '../../sessions/types'

import type {
  PipetteOffsetCalibrationLabware,
  PipetteOffsetCalibrationStep,
} from '../../sessions/pipette-offset-calibration/types'

export type CalibratePipetteOffsetParentProps = {|
  robotName: string,
  session: PipetteOffsetCalibrationSession | null,
  closeWizard: () => void,
|}

export type CalibratePipetteOffsetChildProps = {|
  sendSessionCommands: (...Array<SessionCommandParams>) => void,
  deleteSession: () => void,
  tipRack: PipetteOffsetCalibrationLabware,
  isMulti: boolean,
  mount: string,
  currentStep: PipetteOffsetCalibrationStep,
|}
