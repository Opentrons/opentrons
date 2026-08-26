import { useCallback, useState } from 'react'
import { useQueryClient } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { getUserLoginStatus } from '@opentrons/api-client'
import {
  getSelfQueryKey,
  useAuthSettingsQuery,
  useHost,
} from '@opentrons/react-api-client'

import { getLocalRobot } from '/app/redux/discovery'
import { logOut, useUsernameForRobot } from '/app/redux/robot-auth'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  DEFAULT_MIN_PASSWORD_LENGTH,
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'

import { OnDeviceLogin } from './index'
import styles from './OnDeviceLogin.module.css'

import type {
  AuthUser,
  AuthUserResetPasswordReason,
  OAuth2TokenResponse,
} from '@opentrons/api-client'
import type { State } from '/app/redux/types'
import type { LoginStep } from './index'

type LoginModalPhase = 'login' | 'chooseNewPassword'

const LoginModalImpl = NiceModal.create((): JSX.Element => {
  const modal = useModal()
  const dispatch = useDispatch()
  const host = useHost()
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<LoginModalPhase>('login')
  const [step, setStep] = useState<LoginStep>('username')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginUsername, setLoginUsername] = useState<string | undefined>(
    undefined
  )
  const [resetPasswordReason, setResetPasswordReason] =
    useState<AuthUserResetPasswordReason | null>(null)
  const [isFetchingLoginStatus, setIsFetchingLoginStatus] = useState(false)
  const storeLoginState = useStoreLoginState()
  const localRobotName = useSelector(
    (state: State) => getLocalRobot(state)?.name ?? null
  )
  const loggedInUsername = useUsernameForRobot(localRobotName)

  const isChoosingNewPassword = phase === 'chooseNewPassword'

  const finishModal = useCallback(
    (username: string): void => {
      modal.resolve({ username })
      modal.remove()
    },
    [modal]
  )

  const handleLoginSuccess = useCallback(
    (username: string, user: AuthUser, response: OAuth2TokenResponse): void => {
      setLoginError(null)
      storeLoginState(localRobotName, user, response)

      if (user.resetPassword) {
        setLoginUsername(username)
        setPhase('chooseNewPassword')
        setStep('password')
      } else {
        finishModal(username)
      }
    },
    [finishModal, storeLoginState, localRobotName]
  )

  const dismissModal = useCallback((): void => {
    modal.resolve(null)
    modal.remove()
  }, [modal])

  const handleNewPasswordSuccess = useCallback(
    (username: string) => {
      setLoginError(null)
      setLoginUsername(username)
      if (localRobotName != null) {
        dispatch(logOut({ robotName: localRobotName }))
      }
      if (host != null) {
        void queryClient.invalidateQueries(getSelfQueryKey(host))
      }
      setResetPasswordReason(null)
      setPhase('login')
      setStep('password')
    },
    [dispatch, host, localRobotName, queryClient]
  )

  const handleUsernameSubmit = async (username: string): Promise<void> => {
    setLoginUsername(username)
    if (host == null) return

    setIsFetchingLoginStatus(true)
    try {
      const response = await getUserLoginStatus(host, username)
      setResetPasswordReason(response.data.data.resetPasswordReason ?? null)
    } catch {
      setResetPasswordReason(null)
    } finally {
      setIsFetchingLoginStatus(false)
    }
  }

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
      onError: message => {
        setLoginError(message)
        setStep('password')
      },
    })

  const { data: authSettings } = useAuthSettingsQuery({
    enabled: isChoosingNewPassword,
  })
  const passwordComplexity =
    isChoosingNewPassword && authSettings?.data != null
      ? {
          minLength:
            authSettings.data.passwordComplexityMinimumLength ??
            DEFAULT_MIN_PASSWORD_LENGTH,
          requireSpecialCharacters:
            authSettings.data.passwordComplexitySpecialCharacters === true,
        }
      : null

  const handleCancel = (): void => {
    dismissModal()
  }

  const initialUsername =
    phase === 'chooseNewPassword'
      ? (loggedInUsername ?? loginUsername)
      : loginUsername

  return (
    <div className={styles.overlay}>
      <OnDeviceLogin
        key={phase}
        step={step}
        onStepChange={setStep}
        onUsernameSubmit={phase === 'login' ? handleUsernameSubmit : undefined}
        submitPassword={
          isChoosingNewPassword ? submitNewPassword : submitPassword
        }
        isAuthLoading={
          isChoosingNewPassword
            ? isSetNewPasswordLoading
            : isLoginAuthLoading || isFetchingLoginStatus
        }
        isPasswordResetRequired={isChoosingNewPassword}
        resetPasswordReason={resetPasswordReason}
        initialUsername={initialUsername}
        loginError={loginError}
        onClearLoginError={() => {
          setLoginError(null)
        }}
        passwordComplexity={passwordComplexity}
        onCancel={handleCancel}
      />
    </div>
  )
})

/**
 * Open the login modal and await the result.
 */
export function showLoginModal(): Promise<{ username: string } | null> {
  return NiceModal.show(LoginModalImpl)
}

/**
 * Returns whether the login modal is currently visible.
 */
export function useIsLoginModalOpen(): boolean {
  return useModal(LoginModalImpl).visible
}
