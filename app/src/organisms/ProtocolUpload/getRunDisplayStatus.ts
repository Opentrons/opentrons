import {
  RunData,
  RUN_STATUS_STOPPED,
  RUN_ACTION_TYPE_PLAY,
} from '@opentrons/api-client'

export const RUN_DISPLAY_STATUS_COMPLETE: 'complete' = 'complete'
export const RUN_DISPLAY_STATUS_CANCELED: 'canceled' = 'canceled'
export const RUN_DISPLAY_STATUS_NOT_STARTED: 'not started' = 'not started'

export type RunDisplayStatus =
  | typeof RUN_DISPLAY_STATUS_COMPLETE
  | typeof RUN_DISPLAY_STATUS_CANCELED
  | typeof RUN_DISPLAY_STATUS_NOT_STARTED

export const getRunDisplayStatus = (
  mostRecentRun: RunData
): RunDisplayStatus => {
  if (mostRecentRun.status === RUN_STATUS_STOPPED) {
    if (
      mostRecentRun.actions.find(
        action => action.actionType === RUN_ACTION_TYPE_PLAY
      )
    ) {
      return RUN_DISPLAY_STATUS_CANCELED
    } else {
      return RUN_DISPLAY_STATUS_NOT_STARTED
    }
  } else {
    return RUN_DISPLAY_STATUS_COMPLETE
  }
}
