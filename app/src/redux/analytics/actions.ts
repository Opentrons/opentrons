// Actions for triggering analytics events that don't work well as epics looking
// for unrelated events

import * as CalUITypes from '../../organisms/CalibrationPanels/types'
import * as Types from './types'
import * as Constants from './constants'

export const pipetteOffsetCalibrationStarted = (
  intent: CalUITypes.PipetteOffsetIntent,
  mount: string,
  calBlock: boolean,
  shouldPerformTipLength: boolean,
  tipRackURI: string | null
): Types.PipetteOffsetStartedAnalyticsAction => ({
  type: Constants.ANALYTICS_PIPETTE_OFFSET_STARTED,
  payload: {
    intent: intent,
    mount: mount,
    calBlock: calBlock,
    shouldPerformTipLength: shouldPerformTipLength,
    tipRackURI: tipRackURI,
  },
})

export const tipLengthCalibrationStarted = (
  intent: CalUITypes.PipetteOffsetIntent,
  mount: string,
  calBlock: boolean,
  tipRackURI: string
): Types.TipLengthStartedAnalyticsAction => ({
  type: Constants.ANALYTICS_TIP_LENGTH_STARTED,
  payload: {
    intent: intent,
    mount: mount,
    calBlock: calBlock,
    tipRackURI: tipRackURI,
  },
})
