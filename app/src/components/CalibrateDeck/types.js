// @flow
import type { Action } from '../../types'
import type { DeckCalibrationSession } from '../../sessions/types'

export type CalibrateDeckParentProps = {|
  robotName: string,
  session: DeckCalibrationSession | null,
  closeWizard: () => void,
  dispatchRequests: (
    ...Array<{ ...Action, meta: { requestId: string } }>
  ) => void,
  showSpinner: boolean,
|}
