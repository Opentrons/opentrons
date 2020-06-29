// @flow

import type { ViewableRobot } from '../../discovery/types'
import type { ThunkAction } from '../../types'

export function downloadLogs(robot: ViewableRobot): ThunkAction {
  return (dispatch, getState) => {
    const logPaths = robot.health && robot.health.logs

    if (logPaths) {
      const logUrls = logPaths.map(p => `http://${robot.ip}:${robot.port}${p}`)

      dispatch({
        type: 'shell:DOWNLOAD_LOGS',
        payload: { logUrls },
        meta: { shell: true },
      })
    }
  }
}
