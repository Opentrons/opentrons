import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getLocalRobot } from '/app/redux/discovery'
import { logOut } from '/app/redux/robot-auth'

import type { State } from '/app/redux/types'

/** Returns a function that logs the current robot out of the current account. */
export function useLogOut(): () => void {
  const dispatch = useDispatch()
  const localRobotName = useSelector(
    (state: State) => getLocalRobot(state)?.name ?? null
  )
  const logOutCallback = useCallback(() => {
    if (localRobotName == null) {
      console.warn("Couldn't determine the local robot.")
    } else {
      dispatch(
        logOut({
          robotName: localRobotName,
        })
      )
    }
  }, [dispatch, localRobotName])
  return logOutCallback
}
