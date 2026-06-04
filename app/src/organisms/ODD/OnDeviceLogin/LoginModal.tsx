import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { getSelf } from '@opentrons/api-client'
import { getQueryKey, useHost, useSelfQuery } from '@opentrons/react-api-client'

import { getLocalRobot } from '/app/redux/discovery'
import {
  getCurrentUsernameForLocalRobot,
  getIsLoggedInToLocalRobot,
  logOut,
} from '/app/redux/robot-auth'
import {
  useOAuth2PasswordLogin,
  useUpdateNewPassword,
} from '/app/resources/auth'
import { useToaster } from '/app/organisms/ToasterOven'

import { useStoreLoginState } from './hooks'
import { OnDeviceLogin } from './index'
import styles from './OnDeviceLogin.module.css'

import type { QueryKey } from 'react-query'
import type { OAuth2TokenResponse } from '@opentrons/api-client'
import type { State } from '/app/redux/types'
import type { LoginStep } from './index'

const INVALID_CREDENTIALS_TOAST_DURATION_MS = 3000

export interface LoginModalResult {
  username: string
}

type LoginModalPhase = 'login' | 'chooseNewPassword'

const LoginModalImpl = NiceModal.create((): JSX.Element => {
  const modal = useModal()
  const dispatch = useDispatch()
  const { t } = useTranslation('device_settings')
  const { makeSnackbar } = useToaster()
  const host = useHost()
  const queryClient = useQueryClient()
  const localRobotName = useSelector(
    (state: State) => getLocalRobot(state)?.name ?? null
  )
  const [phase, setPhase] = useState<LoginModalPhase>('login')
  const [step, setStep] = useState<LoginStep>('username')
  const [formKey, setFormKey] = useState(0)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null)
  const storeLoginState = useStoreLoginState()

  const currentUsername = useSelector(getCurrentUsernameForLocalRobot)
  const isLoggedIn = useSelector(getIsLoggedInToLocalRobot)
  const selfQuery = useSelfQuery({
    enabled: isLoggedIn,
  })
  const resetPasswordRequired = selfQuery.data?.data.resetPassword ?? false

  const isChoosingNewPassword = phase === 'chooseNewPassword'

  const shouldSkipToChooseNewPassword =
    resetPasswordRequired &&
    isLoggedIn &&
    currentUsername != null &&
    currentUsername !== '' &&
    phase === 'login'

  // Already logged in with a temp password — skip straight to choosing a new one.
  useEffect(() => {
    if (!shouldSkipToChooseNewPassword) {
      return
    }

    setLoggedInUsername(currentUsername)
    setPhase('chooseNewPassword')
    setStep('password')
    setFormKey(key => key + 1)
  }, [shouldSkipToChooseNewPassword, currentUsername])

  const fetchSelfAfterLogin = useCallback(
    async (accessToken: string) => {
      if (host == null) {
        throw new Error('Missing API host')
      }
      const response = await getSelf({ ...host, token: accessToken })
      return response.data.data
    },
    [host]
  )

  const invalidateSelfQuery = useCallback((): void => {
    if (host == null) return
    void queryClient.invalidateQueries(
      getQueryKey(host, 'auth', 'users', 'self') as QueryKey
    )
  }, [host, queryClient])

  const finishModal = useCallback(
    (username: string): void => {
      const result: LoginModalResult = { username }
      modal.resolve(result)
      modal.remove()
    },
    [modal]
  )

  const handleLoginSuccess = useCallback(
    async (username: string, response: OAuth2TokenResponse): Promise<void> => {
      setLoginError(null)
      storeLoginState(username, response)
      invalidateSelfQuery()

      try {
        const self = await fetchSelfAfterLogin(response.access_token as string)

        if (self.resetPassword) {
          setLoggedInUsername(username)
          setPhase('chooseNewPassword')
          setStep('password')
          setFormKey(key => key + 1)
          return
        }

        finishModal(username)
      } catch {
        setLoginError(t('on_device_login_error_incorrect') as string)
      }
    },
    [fetchSelfAfterLogin, finishModal, invalidateSelfQuery, storeLoginState, t]
  )

  const dismissModal = useCallback((): void => {
    modal.resolve(null)
    modal.remove()
  }, [modal])

  const handleNewPasswordSuccess = useCallback(
    (username: string, response: OAuth2TokenResponse): void => {
      setLoginError(null)
      storeLoginState(username, response)
      invalidateSelfQuery()
      finishModal(username)
    },
    [finishModal, invalidateSelfQuery, storeLoginState]
  )

  const handleNewPasswordFailure = useCallback((): void => {
    if (localRobotName != null) {
      dispatch(logOut({ robotName: localRobotName }))
    }
    invalidateSelfQuery()
    makeSnackbar(
      t('on_device_login_error_incorrect') as string,
      INVALID_CREDENTIALS_TOAST_DURATION_MS
    )
    dismissModal()
  }, [
    dismissModal,
    dispatch,
    invalidateSelfQuery,
    localRobotName,
    makeSnackbar,
    t,
  ])

  const { submitPassword, isAuthLoading: isLoginAuthLoading } =
    useOAuth2PasswordLogin({
      onSuccess: (username, response) => {
        void handleLoginSuccess(username, response)
      },
      onError: () => {
        setLoginError(t('on_device_login_error_incorrect') as string)
      },
    })

  const { updateNewPassword, isLoading: isUpdateNewPasswordLoading } =
    useUpdateNewPassword({
      onSuccess: handleNewPasswordSuccess,
      onError: handleNewPasswordFailure,
    })

  const handleCancel = (): void => {
    dismissModal()
  }

  const initialUsername =
    phase === 'chooseNewPassword'
      ? (loggedInUsername ?? currentUsername ?? undefined)
      : undefined

  return (
    <div className={styles.overlay}>
      <OnDeviceLogin
        key={formKey}
        step={step}
        onStepChange={setStep}
        submitPassword={
          isChoosingNewPassword ? updateNewPassword : submitPassword
        }
        isAuthLoading={
          isChoosingNewPassword ? isUpdateNewPasswordLoading : isLoginAuthLoading
        }
        isPasswordResetRequired={isChoosingNewPassword}
        initialUsername={initialUsername}
        loginError={loginError}
        onClearLoginError={() => {
          setLoginError(null)
        }}
        onCancel={handleCancel}
      />
    </div>
  )
})

/**
 * Open the login modal and await the result.
 */
export const showLoginModal = (): Promise<LoginModalResult | null> =>
  NiceModal.show(LoginModalImpl) as Promise<LoginModalResult | null>

/**
 * Returns whether the login modal is currently visible.
 */
export function useIsLoginModalOpen(): boolean {
  return useModal(LoginModalImpl).visible
}
