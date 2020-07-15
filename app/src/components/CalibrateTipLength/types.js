// @flow
import type { Mount } from '@opentrons/components'
import type {
  SessionCommandString,
  SessionCommandData,
  Session,
  TipLengthCalibrationSession,
} from '../../sessions/types'

export type CalibrateTipLengthParentProps = {|
  robotName: string,
  session: TipLengthCalibrationSession,
  closeWizard: () => void,
  hasBlock: boolean,
|}

export type CalibrateTipLengthChildProps = {|
  ...CalibrateTipLengthParentProps,
  sendSessionCommand: (
    command: SessionCommandString,
    data: SessionCommandData
  ) => void,
|}
