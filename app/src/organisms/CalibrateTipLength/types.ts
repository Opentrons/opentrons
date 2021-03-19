// @flow

import type { TipLengthCalibrationSession } from '../../redux/sessions/types'
import type { Action } from '../../redux/types'

export type CalibrateTipLengthParentProps = {|
  robotName: string,
  session: TipLengthCalibrationSession | null,
  dispatchRequests: (
    ...Array<{ ...Action, meta: { requestId: string } }>
  ) => void,
  showSpinner: boolean,
  isJogging: boolean,
|}
