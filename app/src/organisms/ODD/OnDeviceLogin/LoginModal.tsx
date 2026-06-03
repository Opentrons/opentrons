import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useSelector } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { getSelf } from '@opentrons/api-client'
import { getQueryKey, useHost, useSelfQuery } from '@opentrons/react-api-client'

import {
  getCurrentUsernameForLocalRobot,
  getIsLoggedInToLocalRobot,
} from '/app/redux/robot-auth'
import { useOAuth2PasswordLogin } from '/app/resources/auth'

import { useStoreLoginState } from './hooks'
import { OnDeviceLogin } from './index'
import styles from './OnDeviceLogin.module.css'

import type { QueryKey } from 'react-query'
import type { OAuth2TokenResponse } from '@opentrons/api-client'
import type { LoginStep } from './index'

export interface LoginModalResult {
  username: string
}

type LoginModalPhase = 'login' | 'chooseNewPassword'

const LoginModalImpl = NiceModal.create((): JSX.Element => {
  const modal = useModal()
  const { t } = useTranslation('device_settings')
  const host = useHost()
  const queryClient = useQueryClient()
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

  const isTemporaryPasswordLogin = phase === 'login' && resetPasswordRequired
  const isChoosingNewPassword = phase === 'chooseNewPassword'

  useEffect(() => {
    if (
      isTemporaryPasswordLogin &&
      currentUsername != null &&
      currentUsername !== ''
    ) {
      setStep('password')
    }
  }, [isTemporaryPasswordLogin, currentUsername])

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

  const handleNewPasswordSuccess = useCallback(
    async (username: string, response: OAuth2TokenResponse): Promise<void> => {
      setLoginError(null)
      storeLoginState(username, response)
      invalidateSelfQuery()

      try {
        const self = await fetchSelfAfterLogin(response.access_token as string)

        if (self.resetPassword) {
          setLoginError(t('on_device_login_error_incorrect') as string)
          return
        }

        finishModal(username)
      } catch {
        setLoginError(t('on_device_login_error_incorrect') as string)
      }
    },
    [fetchSelfAfterLogin, finishModal, invalidateSelfQuery, storeLoginState, t]
  )

  const { submitPassword, isAuthLoading } = useOAuth2PasswordLogin({
    onSuccess: (username, response) => {
      if (isChoosingNewPassword) {
        void handleNewPasswordSuccess(username, response)
      } else {
        void handleLoginSuccess(username, response)
      }
    },
    onError: () => {
      setLoginError(t('on_device_login_error_incorrect') as string)
    },
  })

  const handleCancel = (): void => {
    modal.resolve(null)
    modal.remove()
  }

  const initialUsername =
    phase === 'chooseNewPassword'
      ? (loggedInUsername ?? undefined)
      : isTemporaryPasswordLogin && currentUsername != null
        ? currentUsername
        : undefined

  return (
    <div className={styles.overlay}>
      <OnDeviceLogin
        key={formKey}
        step={step}
        onStepChange={setStep}
        submitPassword={submitPassword}
        isAuthLoading={isAuthLoading}
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
