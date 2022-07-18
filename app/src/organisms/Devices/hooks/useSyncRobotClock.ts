import * as React from 'react'
import { useDispatch } from 'react-redux'
import { syncSystemTime } from '../../../redux/robot-admin'

import type { Dispatch } from '../../../redux/types'

/**
 * syncs robot system time once on mount
 * @param {string} robotName name of robot to sync system time
 * @returns {void}
 */
export function useSyncRobotClock(robotName: string | null): void {
  const dispatch = useDispatch<Dispatch>()

  React.useEffect(() => {
    if (robotName != null) {
      dispatch(syncSystemTime(robotName))
    }
  }, [robotName, dispatch])
}
