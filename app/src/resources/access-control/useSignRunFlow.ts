import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from 'react-query'

import {
  fetchSelfQuery,
  getSelfQueryKey,
  useAuthSettingsQuery,
  useHost,
  useSelfQuery,
  useSignRunMutation,
} from '@opentrons/react-api-client'

import { useLogout } from '/app/redux/robot-auth'

import { useNotifyRunQuery } from '../runs'

import type { DocumentationState } from '@opentrons/react-api-client'

// login gate states to control login prompting
// idle: need to prompt for login
// prompting: login prompt in flight, or waiting for post-login /self
// needsadmin: logged in, but user can't sign
// done: logged in and this account can sign
type LoginGate = 'idle' | 'prompting' | 'needsadmin' | 'done'

export interface SignRunFlowResult {
  signRun: () => void
  isLoading: boolean
  isSigned: boolean
  loginGate: LoginGate
  name: string
  logout: () => void
}

export function useSignRunFlow(
  runId: string,
  robotName: string,
  showLoginModal: (props: {
    robotName: string
    uncloseable: boolean
    key?: string
  }) => Promise<{ username: string } | null>,
  popToast: () => void,
  eatToast: () => void,
  documentationState: DocumentationState,
  isOnDevice: boolean,
  onSigned?: () => void
): SignRunFlowResult {
  const queryClient = useQueryClient()
  const host = useHost()
  const logout = useLogout()
  const { signRun: signRunMutation, isLoading: isSignRunLoading } =
    useSignRunMutation(documentationState)

  const { data: run } = useNotifyRunQuery(runId)
  const isSigned = !!run?.data?.signedBy

  const { data: authSettings, isLoading: isAuthSettingsLoading } =
    useAuthSettingsQuery()
  const {
    data: self,
    isLoading: isSelfLoading,
    isFetching: isSelfFetching,
  } = useSelfQuery()

  const isAuthLoading = isAuthSettingsLoading || isSelfLoading
  const isLoading = isAuthLoading || isSignRunLoading

  const isLoggedIn = !!self?.data?.username

  const requireAdmin =
    authSettings?.data.requireAdminCredsForSignoffProtocol === true
  const isAdmin = self?.data.accountType === 'admin'
  const canSignProtocol = !requireAdmin || isAdmin

  const [loginInFlight, setLoginInFlight] = useState(false)
  const [refetchSelf, setRefetchSelf] = useState(false)
  const loginGate = useMemo(() => {
    if (loginInFlight) {
      return 'prompting'
    }
    if (!isLoggedIn) {
      return 'idle'
    }
    if (!canSignProtocol) {
      return 'needsadmin'
    }
    return 'done'
  }, [canSignProtocol, isLoggedIn, loginInFlight])

  useEffect(() => {
    if (!refetchSelf) {
      return
    }
    // waiting for token to land on host
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
  }, [refetchSelf, eatToast, queryClient, host])

  const handleLogBackIn = useCallback(() => {
    setLoginInFlight(true)
    void showLoginModal({
      robotName,
      uncloseable: true,
      // forces rerender
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
  }, [eatToast, robotName, showLoginModal, setLoginInFlight, setRefetchSelf])

  const handleLogout = useCallback(() => {
    logout()
    queryClient.removeQueries(getSelfQueryKey(host))
    handleLogBackIn()
  }, [logout, queryClient, host, handleLogBackIn])

  useEffect(() => {
    if (isAuthLoading || isSelfFetching) {
      return
    }
    switch (loginGate) {
      case 'needsadmin':
        handleLogout()
        popToast()
        break
      case 'idle':
        if (isOnDevice) {
          break
        }
        handleLogBackIn()
        break
      // waiting for login to finish / self to settle
      case 'prompting':
        break
      // we're all set
      case 'done':
        break
    }
  }, [
    handleLogout,
    handleLogBackIn,
    popToast,
    isAuthLoading,
    isSelfFetching,
    loginGate,
    isOnDevice,
  ])

  const signRun = useCallback(() => {
    const name = self?.data?.fullName ?? null
    if (!name) {
      return
    }
    signRunMutation(
      { runId, name },
      {
        onSuccess: () => {
          onSigned?.()
        },
      }
    )
  }, [self?.data?.fullName, signRunMutation, runId, onSigned])

  return {
    signRun,
    isLoading,
    loginGate,
    isSigned,
    name: self?.data?.fullName ?? '',
    logout: handleLogout,
  }
}
