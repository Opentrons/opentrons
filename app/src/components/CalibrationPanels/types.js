// @flow
import type {
  SessionCommandParams,
  SessionType,
  CalibrationSessionStep,
  CalibrationLabware,
  CalibrationHealthCheckInstrument,
  CalibrationHealthCheckComparisonByPipette,
} from '../../sessions/types'

export type CalibrationPanelProps = {|
  sendCommands: (...Array<SessionCommandParams>) => void,
  cleanUpAndExit: () => void,
  tipRack: CalibrationLabware,
  isMulti: boolean,
  mount: string,
  currentStep: CalibrationSessionStep,
  sessionType: SessionType,
  calBlock?: CalibrationLabware | null,
  shouldPerformTipLength?: boolean | null,
  checkBothPipettes?: boolean | null,
  instruments?: Array<CalibrationHealthCheckInstrument> | null,
  comparisonsByPipette?: CalibrationHealthCheckComparisonByPipette | null,
  activePipette?: CalibrationHealthCheckInstrument,
|}
