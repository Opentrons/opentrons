// @flow
import type { Action } from '../../redux/types'
import type {
  SessionCommandParams,
  PipetteOffsetCalibrationSession,
  CalibrationLabware,
} from '../../redux/sessions/types'
import type { PipetteOffsetIntent } from '../CalibrationPanels/types'

import type { PipetteOffsetCalibrationStep } from '../../redux/sessions/pipette-offset-calibration/types'

export type CalibratePipetteOffsetParentProps = {|
  robotName: string,
  session: PipetteOffsetCalibrationSession | null,
  dispatchRequests: (
    ...Array<{ ...Action, meta: { requestId: string } }>
  ) => void,
  showSpinner: boolean,
  isJogging: boolean,
  intent: PipetteOffsetIntent,
|}

export type CalibratePipetteOffsetChildProps = {|
  sendSessionCommands: (...Array<SessionCommandParams>) => void,
  deleteSession: () => void,
  tipRack: CalibrationLabware,
  isMulti: boolean,
  mount: string,
  currentStep: PipetteOffsetCalibrationStep,
|}
