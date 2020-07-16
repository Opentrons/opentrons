// @flow
import type { Mount } from '@opentrons/components'
import type {
  SessionCommandString,
  SessionCommandData,
  Session,
  TipLengthCalibrationSession,
} from '../../sessions/types'
import type {
  TipLengthCalibrationInstrument,
  TipLengthCalibrationLabware,
} from '../../sessions/tip-length-calibration/types'

export type CalibrateTipLengthParentProps = {|
  robotName: string,
  session: TipLengthCalibrationSession,
  closeWizard: () => void,
  hasBlock: boolean,
|}

export type CalibrateTipLengthChildProps = {|
  instrument: TipLengthCalibrationInstrument,
  labware: Array<TipLengthCalibrationLabware>,
  sendSessionCommand: (
    command: SessionCommandString,
    data?: SessionCommandData
  ) => void,
  hasBlock: boolean,
  deleteSession: () => void,
|}
