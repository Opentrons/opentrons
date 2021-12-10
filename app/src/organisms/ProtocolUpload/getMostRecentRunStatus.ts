import {
  RunData,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
  RUN_ACTION_TYPE_PLAY,
} from '@opentrons/api-client'

export const getMostRecentRunStatus = (mostRecentRun: RunData) => {
  if (mostRecentRun.status === RUN_STATUS_STOPPED) {
    if (mostRecentRun.actions[0].actionType === RUN_ACTION_TYPE_PLAY) {
      return 'canceled'
    } else {
      return 'not started'
    }
  } else {
    return 'complete'
  }
}
