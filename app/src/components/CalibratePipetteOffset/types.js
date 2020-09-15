// @flow
import type {
  SessionCommandString,
  SessionCommandData,
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

export type CommandToSend = {
  command: SessionCommandString,
  data?: SessionCommandData,
  loadingSpinner?: boolean,
}

export type CalibratePipetteOffsetChildProps = {|
  sendSessionCommands: (Array<CommandToSend>) => void,
  deleteSession: () => void,
  tipRack: PipetteOffsetCalibrationLabware,
  isMulti: boolean,
  mount: string,
  currentStep: PipetteOffsetCalibrationStep,
|}
