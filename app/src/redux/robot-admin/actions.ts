import * as Constants from './constants'

import type * as Types from './types'

export const restartStatusChanged = (
  robotName: string,
  restartStatus: Types.RobotRestartStatus,
  bootId: string | null = null,
  startTime: Date | null = null
): Types.RestartStatusChangedAction => ({
  type: Constants.RESTART_STATUS_CHANGED,
  payload: { robotName, restartStatus, bootId, startTime },
})
