import { useEffect } from 'react'
import { useQueryClient } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'

import { addRequestErrorListener, GET } from '@opentrons/api-client'
import { getSelfQueryKey } from '@opentrons/react-api-client'

import { useLocalRobotName } from '/app/redux-resources/robots/hooks/useLocalRobotName'
import { getIsOnDevice } from '/app/redux/config'
import { getIsLoggedInToAnyRobot, logOut } from '/app/redux/robot-auth'

import { useInsufficientPermissionsToast } from './useInsufficientPermissionsToast'
import { isInsufficientScopeError } from './utils'

import type { Dispatch } from '/app/redux/types'

/**
 * When a user action (any non-GET request) is rejected because the logged-in
 * account lacks permission, log out of that robot and show a toast.
 *
 * This should be called once per app, inside a ToasterOven.
 */
export function useHandleInsufficientPermissions(): void {
  const dispatch = useDispatch<Dispatch>()
  const queryClient = useQueryClient()
  const isOnDevice = useSelector(getIsOnDevice)
  const isLoggedInToAnyRobot = useSelector(getIsLoggedInToAnyRobot)
  const localRobotName = useLocalRobotName()
  const { popToast } = useInsufficientPermissionsToast()

  useEffect(() => {
    if (!isLoggedInToAnyRobot) {
      return
    }

    return addRequestErrorListener((error, method, hostConfig) => {
      if (method.toUpperCase() === GET || !isInsufficientScopeError(error)) {
        return
      }
      const robotName =
        hostConfig.robotName ?? (isOnDevice ? localRobotName : null)
      if (robotName != null) {
        dispatch(logOut({ robotName }))
      }
      queryClient.removeQueries(getSelfQueryKey(hostConfig))
      popToast()
    })
  }, [
    dispatch,
    isLoggedInToAnyRobot,
    isOnDevice,
    localRobotName,
    popToast,
    queryClient,
  ])
}
