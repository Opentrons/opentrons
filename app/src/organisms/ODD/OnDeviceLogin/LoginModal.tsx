import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { getSelfQueryKey, useHost } from '@opentrons/react-api-client'

import { useToaster } from '/app/organisms/ToasterOven'
import { getLocalRobot } from '/app/redux/discovery'
import { logOut } from '/app/redux/robot-auth'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'

import { clearStaleAuthBeforeLogin } from './clearStaleAuthBeforeLogin'
import { OnDeviceLogin } from './index'
import styles from './OnDeviceLogin.module.css'

import type { QueryClient } from 'react-query'
import type {
  AuthUser,
  HostConfig,
  OAuth2TokenResponse,
} from '@opentrons/api-client'
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
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null)
  const storeLoginState = useStoreLoginState()

  const isChoosingNewPassword = phase === 'chooseNewPassword'

  const invalidateSelfQuery = useCallback((): void => {
    if (host == null) return
    void queryClient.invalidateQueries(getSelfQueryKey(host))
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
    (username: string, user: AuthUser, response: OAuth2TokenResponse): void => {
      setLoginError(null)
      storeLoginState(username, response)
      invalidateSelfQuery()

      if (user.resetPassword) {
        setLoggedInUsername(username)
        setPhase('chooseNewPassword')
        setStep('password')
        return
      }

      finishModal(username)
    },
    [finishModal, invalidateSelfQuery, storeLoginState]
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
      onSuccess: handleLoginSuccess,
      onError: message => {
        setLoginError(message)
      },
    })

  const { submitNewPassword, isLoading: isSetNewPasswordLoading } =
    useSetNewPasswordAndSignIn({
      onSuccess: handleNewPasswordSuccess,
      onError: handleNewPasswordFailure,
    })

  const handleCancel = (): void => {
    dismissModal()
  }

  const initialUsername =
    phase === 'chooseNewPassword' ? (loggedInUsername ?? undefined) : undefined

  return (
    <div className={styles.overlay}>
      <OnDeviceLogin
        key={phase}
        step={step}
        onStepChange={setStep}
        submitPassword={
          isChoosingNewPassword ? submitNewPassword : submitPassword
        }
        isAuthLoading={
          isChoosingNewPassword ? isSetNewPasswordLoading : isLoginAuthLoading
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
export function showLoginModal(
  queryClient: QueryClient,
  hostConfig: HostConfig | null
): Promise<LoginModalResult | null> {
  return clearStaleAuthBeforeLogin(queryClient, hostConfig).then(
    () => NiceModal.show(LoginModalImpl) as Promise<LoginModalResult | null>
  )
}

/**
 * Returns whether the login modal is currently visible.
 */
export function useIsLoginModalOpen(): boolean {
  return useModal(LoginModalImpl).visible
}
