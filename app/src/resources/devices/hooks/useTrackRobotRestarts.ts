import { useEffect } from 'react'
import { useDispatch, useStore } from 'react-redux'

import { getDiscoveredRobots } from '/app/redux/discovery'
import { restartStatusChanged } from '/app/redux/robot-admin'
import { getNextRestartStatus } from '/app/redux/robot-admin/selectors'

import type { Dispatch, State } from '/app/redux/types'

/**
 * Watches discovery connectivity / bootId and advances per-robot restart
 * status.
 */
export function useTrackRobotRestarts(): void {
  const dispatch = useDispatch<Dispatch>()
  const store = useStore<State>()

  useEffect(() => {
    const updateRestartStatuses = (): void => {
      const state = store.getState()
      const now = new Date()

      for (const robot of getDiscoveredRobots(state)) {
        const nextStatus = getNextRestartStatus(
          state,
          robot.name,
          robot.status,
          robot.serverHealth?.bootId ?? null,
          now
        )
        if (nextStatus != null) {
          dispatch(restartStatusChanged(robot.name, nextStatus))
        }
      }
    }

    updateRestartStatuses()
    return store.subscribe(updateRestartStatuses)
  }, [dispatch, store])
}
