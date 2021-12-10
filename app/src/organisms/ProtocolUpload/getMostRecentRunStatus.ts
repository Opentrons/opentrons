import {
  RunData,
  RUN_STATUS_STOPPED,
  RUN_ACTION_TYPE_PLAY,
} from '@opentrons/api-client'

export const MOST_RECENT_RUN_STATUS_COMPLETE: 'complete' = 'complete'
export const MOST_RECENT_RUN_STATUS_CANCELED: 'canceled' = 'canceled'
export const MOST_RECENT_RUN_STATUS_NOT_STARTED: 'not started' = 'not started'

export type MostRecentRunStatus =
  | typeof MOST_RECENT_RUN_STATUS_COMPLETE
  | typeof MOST_RECENT_RUN_STATUS_CANCELED
  | typeof MOST_RECENT_RUN_STATUS_NOT_STARTED

export const getMostRecentRunStatus = (
  mostRecentRun: RunData
): MostRecentRunStatus => {
  if (mostRecentRun.status === RUN_STATUS_STOPPED) {
    if (mostRecentRun.actions[0].actionType === RUN_ACTION_TYPE_PLAY) {
      return MOST_RECENT_RUN_STATUS_CANCELED
    } else {
      return MOST_RECENT_RUN_STATUS_NOT_STARTED
    }
  } else {
    return MOST_RECENT_RUN_STATUS_COMPLETE
  }
}
