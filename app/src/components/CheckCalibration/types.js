// @flow
import type { Action } from '../../types'
import type {
  SessionCommandParams,
  CalibrationCheckSession,
  CalibrationLabware,
  RobotCalibrationCheckStep,
} from '../../sessions/types'

export type CalibrationHealthCheckParentProps = {|
  robotName: string,
  session: CalibrationCheckSession | null,
  dispatchRequests: (
    ...Array<{ ...Action, meta: { requestId: string } }>
  ) => void,
  isJogging: boolean,
  showSpinner: boolean,
  hasBlock?: boolean,
|}

export type CalibrateHealthCheckChildProps = {|
  sendSessionCommands: (...Array<SessionCommandParams>) => void,
  deleteSession: () => void,
  tipRackList: Array<CalibrationLabware>,
  isMulti: boolean,
  mount: string,
  currentStep: RobotCalibrationCheckStep,
|}
