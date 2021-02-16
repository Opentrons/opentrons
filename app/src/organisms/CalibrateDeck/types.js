// @flow
import type { Action } from '../../redux/types'
import type { DeckCalibrationSession } from '../../redux/sessions/types'

export type CalibrateDeckParentProps = {|
  robotName: string,
  session: DeckCalibrationSession | null,
  dispatchRequests: (
    ...Array<{ ...Action, meta: { requestId: string } }>
  ) => void,
  showSpinner: boolean,
  isJogging: boolean,
|}
