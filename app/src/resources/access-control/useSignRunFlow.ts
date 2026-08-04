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

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useLogout } from '/app/redux/robot-auth'

// login gate states to control login prompting
// idle: need to prompt for login
// prompting: login prompt in flight, or waiting for post-login /self
// needsadmin: logged in, but user can't sign
// done: logged in and this account can sign
type LoginGate = 'idle' | 'prompting' | 'needsadmin' | 'done'

export interface SignRunFlowResult {
  signRun: (name: string) => void
  isLoading: boolean
  loginGate: LoginGate
  correctName: string | undefined
}

export function useSignRunFlow(
  runId: string,
  robotName: string,
  showLoginModal: (props: {
    robotName: string
    uncloseable: boolean
  }) => Promise<{ username: string } | null>,
  popToast: () => void,
  eatToast: () => void
): SignRunFlowResult {
  const queryClient = useQueryClient()
  const host = useHost()
  const logout = useLogout()
  const documentationState = useDocumentationState()
  const { signRun: signRunMutation, isLoading: isSignRunLoading } =
    useSignRunMutation(documentationState)

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

  useEffect(() => {
    if (isAuthLoading || isSelfFetching) {
      return
    }
    switch (loginGate) {
      case 'needsadmin':
        logout()
        popToast()
        queryClient.removeQueries(getSelfQueryKey(host))
      // prompt for login
      // eslint-disable-next-line no-fallthrough -- just being cute :)
      case 'idle':
        setLoginInFlight(true)
        void showLoginModal({ robotName, uncloseable: true })
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
        break
      // waiting for login to finish / self to settle
      case 'prompting':
        break
      // we're all set
      case 'done':
        break
    }
  }, [
    eatToast,
    host,
    isAuthLoading,
    isSelfFetching,
    loginGate,
    logout,
    popToast,
    queryClient,
    robotName,
    showLoginModal,
  ])

  const signRun = useCallback(
    (name: string) => {
      const trimmedName = name.trim()
      if (!trimmedName || trimmedName !== self?.data?.fullName) {
        return
      }
      signRunMutation({ runId, name })
    },
    [self?.data?.fullName, signRunMutation, runId]
  )

  return {
    signRun,
    isLoading,
    loginGate,
    correctName: self?.data?.fullName,
  }
}
