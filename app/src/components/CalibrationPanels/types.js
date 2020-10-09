// @flow
import type {
  SessionCommandParams,
  SessionType,
  CalibrationSessionStep,
  CalibrationLabware,
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
|}
