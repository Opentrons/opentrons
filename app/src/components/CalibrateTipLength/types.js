// @flow
import type {
  SessionCommandString,
  SessionCommandData,
  TipLengthCalibrationSession,
} from '../../sessions/types'
import type {
  TipLengthCalibrationInstrument,
  TipLengthCalibrationLabware,
} from '../../sessions/tip-length-calibration/types'

export type CalibrateTipLengthParentProps = {|
  robotName: string,
  session: TipLengthCalibrationSession | null,
  closeWizard: () => void,
  hasBlock: boolean,
|}

export type CalibrateTipLengthChildProps = {|
  instrument: TipLengthCalibrationInstrument,
  labware: Array<TipLengthCalibrationLabware>,
  sendSessionCommand: (
    command: SessionCommandString,
    data?: SessionCommandData,
    trackRequest?: boolean
  ) => void,
  hasBlock: boolean,
  deleteSession: () => void,
|}
