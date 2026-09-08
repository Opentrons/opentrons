import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'

import { WARNING_TOAST } from '@opentrons/components'
import {
  fetchSelfQuery,
  getSelfQueryKey,
  useAccessControlEnabledQuery,
  useAuthSettingsQuery,
  useHost,
  useSelfQuery,
} from '@opentrons/react-api-client'

// eslint-disable-next-line opentrons/no-imports-across-applications
import { useToaster } from '/app/organisms/ToasterOven'
import { useRobot } from '/app/redux-resources/robots'
import { getIsOnDevice } from '/app/redux/config'
import { logOut, useAccessTokenForRobot } from '/app/redux/robot-auth'

import { DocumentationRequiredModalContext } from './DocumentationRequiredModalContext'
import { isAdminEquivalentAccountType } from './utils'

import type { QueryKey } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'

// Above typical login overlays so the toast remains visible on login.
const TOAST_ABOVE_LOGIN_Z_INDEX = 10002

export interface RequireAdminForUpdatesResult {
  isLoading: boolean
  ensureCanUpdate: () => boolean
}

/**
 * One-shot gate for robot software and firmware updates that require admin
 * credentials. Call from UI already under ToasterOven.
 *
 * When the user cannot complete the update, logs out of the target robot,
 * shows a toast, and prompts login if on desktop.
 * Does not auto-continue the update.
 */
export function useRequireAdminForUpdates(
  robotName: string | null
): RequireAdminForUpdatesResult {
  const { t, i18n } = useTranslation(['access_control', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const queryClient = useQueryClient()
  const isOnDevice = useSelector(getIsOnDevice)
  const { makeToast, eatToast: eatToasterToast } = useToaster()
  const { showLoginModal } = useContext(DocumentationRequiredModalContext)

  const host = useHostConfigForRobot(robotName)

  const { data: accessControl, isLoading: isAccessControlLoading } =
    useAccessControlEnabledQuery(undefined, host)
  const { data: authSettings, isLoading: isAuthSettingsLoading } =
    useAuthSettingsQuery(undefined, host)
  const { data: self, isLoading: isSelfLoading } = useSelfQuery(undefined, host)

  const isLoading =
    robotName != null &&
    (host == null ||
      isAccessControlLoading === true ||
      isAuthSettingsLoading === true ||
      isSelfLoading === true)

  const accessControlEnabled = accessControl?.data.accessControlEnabled === true
  const requireAdmin =
    authSettings?.data.requireAdminCredsWhenUpdatingRobotSoftware === true
  const isLoggedIn = self?.data.username != null
  const isAdmin = isAdminEquivalentAccountType(self?.data.accountType)
  const canUpdate = !accessControlEnabled || !requireAdmin || isAdmin

  const permissionToastIdRef = useRef<string | null>(null)
  const [loginInFlight, setLoginInFlight] = useState(false)
  const [refetchSelf, setRefetchSelf] = useState(false)

  const eatToast = useCallback((): void => {
    if (permissionToastIdRef.current != null) {
      eatToasterToast(permissionToastIdRef.current)
      permissionToastIdRef.current = null
    }
  }, [eatToasterToast])

  const popToast = useCallback((): void => {
    eatToast()
    permissionToastIdRef.current = makeToast(
      '' + t('admin_credentials_required_description'),
      WARNING_TOAST,
      {
        closeButton: true,
        buttonText: i18n.format(t('shared:close'), 'capitalize'),
        disableTimeout: true,
        heading: '' + t('admin_credentials_required'),
        zIndex: TOAST_ABOVE_LOGIN_Z_INDEX,
      }
    )
  }, [eatToast, i18n, makeToast, t])

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
