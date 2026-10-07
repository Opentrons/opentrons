import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'

import {
  fetchSelfQuery,
  getSelfQueryKey,
  useAccessControlEnabledQuery,
  useAuthSettingsQuery,
  useHost,
  useSelfQuery,
} from '@opentrons/react-api-client'

import { useRobot } from '/app/redux-resources/robots'
import { getIsOnDevice } from '/app/redux/config'
import { logOut, useAccessTokenForRobot } from '/app/redux/robot-auth'

import { DocumentationRequiredModalContext } from './DocumentationRequiredModalContext'
import { useInsufficientPermissionsToast } from './useInsufficientPermissionsToast'
import { isAdminEquivalentAccountType } from './utils'

import type { QueryKey } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'

export interface RequireAdminForUpdatesResult {
  isLoading: boolean
  ensureCanUpdate: () => boolean
}

/**
 * One-shot gate for robot software and firmware updates that require admin
 * credentials.
 *
 * When the user cannot complete the update, logs out of the target robot,
 * shows a toast, and prompts login if on desktop.
 * Does not auto-continue the update.
 */
export function useRequireAdminForUpdates(
  robotName: string | null
): RequireAdminForUpdatesResult {
  const dispatch = useDispatch<Dispatch>()
  const queryClient = useQueryClient()
  const isOnDevice = useSelector(getIsOnDevice)
  const { popToast, eatToast } = useInsufficientPermissionsToast()
  const { showLoginModal } = useContext(DocumentationRequiredModalContext)

  const host = useHostConfigForRobot(robotName)

  const { data: accessControl, isLoading: isAccessControlLoading } =
    useAccessControlEnabledQuery({ retry: false }, host)
  const { data: authSettings, isLoading: isAuthSettingsLoading } =
    useAuthSettingsQuery({ retry: false }, host)
  const { data: self, isLoading: isSelfLoading } = useSelfQuery(
    { retry: false },
    host
  )

  const accessControlEnabled = accessControl?.data.accessControlEnabled === true
  const isLoading =
    robotName != null &&
    (host == null ||
      isAccessControlLoading === true ||
      (accessControlEnabled &&
        (isAuthSettingsLoading === true || isSelfLoading === true)))

  const requireAdmin =
    authSettings?.data.requireAdminCredsWhenUpdatingRobotSoftware === true
  const isLoggedIn = self?.data.username != null
  const isAdmin = isAdminEquivalentAccountType(self?.data.accountType)
  const canUpdate = !accessControlEnabled || !requireAdmin || isAdmin

  const [loginInFlight, setLoginInFlight] = useState(false)
  const [refetchSelf, setRefetchSelf] = useState(false)

  const handleLogBackIn = useCallback((): void => {
    if (robotName == null) {
      return
    }
    setLoginInFlight(true)
    void showLoginModal({
      robotName,
      uncloseable: true,
      key: crypto.randomUUID(),
    })
      .then(result => {
        if (result == null) {
          eatToast()
          setLoginInFlight(false)
          return
        }
        setRefetchSelf(true)
      })
      .catch(() => {
        eatToast()
        setLoginInFlight(false)
      })
  }, [eatToast, robotName, showLoginModal])

  useEffect(() => {
    if (!refetchSelf) {
      return
    }
    if (host?.token == null || host.token === '') {
      return
    }

    let cancelled = false
    void fetchSelfQuery(queryClient, host).finally(() => {
      if (cancelled) {
        return
      }
      eatToast()
      setRefetchSelf(false)
      setLoginInFlight(false)
    })
    return () => {
      cancelled = true
    }
  }, [eatToast, host, queryClient, refetchSelf])

  const ensureCanUpdate = useCallback((): boolean => {
    if (robotName == null || isLoading || loginInFlight) {
      return false
    }
    if (canUpdate) {
      return true
    }
    if (!isLoggedIn) {
      if (isOnDevice) {
        return false
      }
      handleLogBackIn()
      return false
    }

    dispatch(logOut({ robotName }))
    const selfQueryKey: QueryKey = getSelfQueryKey(host)
    queryClient.removeQueries(selfQueryKey)
    popToast()
    handleLogBackIn()
    return false
  }, [
    canUpdate,
    dispatch,
    handleLogBackIn,
    host,
    isLoading,
    isLoggedIn,
    loginInFlight,
    isOnDevice,
    popToast,
    queryClient,
    robotName,
  ])

  return { isLoading, ensureCanUpdate }
}

function useHostConfigForRobot(robotName: string | null): HostConfig | null {
  const contextHost = useHost()
  const robot = useRobot(robotName)
  const token = useAccessTokenForRobot(robotName)

  return useMemo(() => {
    if (robotName == null) {
      return null
    }
    if (robot?.ip != null) {
      return {
        hostname: robot.ip,
        port: robot.port ?? null,
        robotName,
        token,
      }
    }
    if (contextHost != null) {
      return { ...contextHost, token: token ?? contextHost.token }
    }
    return null
  }, [contextHost, robot, robotName, token])
}
