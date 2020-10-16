// @flow

import type { TipLengthCalibrationSession } from '../../sessions/types'
import type { Action } from '../../types'

export type CalibrateTipLengthParentProps = {|
  robotName: string,
  session: TipLengthCalibrationSession | null,
  closeWizard: () => void,
  dispatchRequests: (
    ...Array<{ ...Action, meta: { requestId: string } }>
  ) => void,
  showSpinner: boolean,
  isJogging: boolean,
|}
