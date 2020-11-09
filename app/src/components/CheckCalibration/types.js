// @flow
import type { Action } from '../../types'
import type { CalibrationCheckSession } from '../../sessions/types'

export type CalibrationCheckParentProps = {|
  robotName: string,
  session: CalibrationCheckSession | null,
  dispatchRequests: (
    ...Array<{ ...Action, meta: { requestId: string } }>
  ) => void,
  isJogging: boolean,
  showSpinner: boolean,
  hasBlock?: boolean,
|}
