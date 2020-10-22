// @flow
import type {
  SessionCommandParams,
  SessionType,
  CalibrationSessionStep,
  CalibrationLabware,
  CalibrationHealthCheckInstrument,
  CalibrationHealthCheckComparisonByPipette,
} from '../../sessions/types'

// TODO (lc 10-20-2020) Given there are lots of optional
// keys here now we should split these panel props out
// into different session types and combine them into
// a union object
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
