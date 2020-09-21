// @flow

import type {
  SessionCommandString,
  SessionCommandData,
  TipLengthCalibrationSession,
} from '../../sessions/types'
import type { TipLengthCalibrationLabware } from '../../sessions/tip-length-calibration/types'
import type { Action } from '../../types'

export type CalibrateTipLengthParentProps = {|
  robotName: string,
  session: TipLengthCalibrationSession | null,
  closeWizard: () => void,
  hasBlock: boolean,
  dispatchRequests: (
    ...Array<{ ...Action, meta: { requestId: string } }>
  ) => void,
  showSpinner: boolean,
|}
