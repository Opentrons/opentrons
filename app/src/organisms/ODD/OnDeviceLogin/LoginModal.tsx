import { useCallback, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import {
  POSITION_FIXED,
  SPACING,
  SUCCESS_TOAST,
  Toast,
} from '@opentrons/components'
import { useAuthSettingsQuery } from '@opentrons/react-api-client'

import { getLocalRobot } from '/app/redux/discovery'
import { useUsernameForRobot } from '/app/redux/robot-auth'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  DEFAULT_MIN_PASSWORD_LENGTH,
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'

import { OnDeviceLogin } from './index'
import styles from './OnDeviceLogin.module.css'

import type { AuthUser, OAuth2TokenResponse } from '@opentrons/api-client'
import type { State } from '/app/redux/types'
import type { LoginStep } from './index'

type LoginModalPhase = 'login' | 'chooseNewPassword'

const PASSWORD_UPDATED_TOAST_MS = 2000

const LoginModalImpl = NiceModal.create((): JSX.Element => {
  const modal = useModal()
  const { t } = useTranslation(['access_control'])
  const passwordUpdatedToastId = useId()
  const [phase, setPhase] = useState<LoginModalPhase>('login')
  const [step, setStep] = useState<LoginStep>('username')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginUsername, setLoginUsername] = useState<string | undefined>(
    undefined
  )
  const [passwordUpdatedUsername, setPasswordUpdatedUsername] = useState<
    string | null
  >(null)
  const storeLoginState = useStoreLoginState()
  const localRobotName = useSelector(
    (state: State) => getLocalRobot(state)?.name ?? null
  )
  const loggedInUsername = useUsernameForRobot(localRobotName)

  const isChoosingNewPassword = phase === 'chooseNewPassword'

  const finishModal = useCallback(
    (
      username: string,
      options?: { showPasswordUpdatedToast?: boolean }
    ): void => {
      if (options?.showPasswordUpdatedToast === true) {
        setPasswordUpdatedUsername(username)
        return
      }

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
        finishModal(username, {
          showPasswordUpdatedToast: isChoosingNewPassword,
        })
      }
    },
    [finishModal, storeLoginState, localRobotName, isChoosingNewPassword]
  )

  const dismissModal = useCallback((): void => {
    modal.resolve(null)
    modal.remove()
  }, [modal])

  const { submitPassword, isAuthLoading: isLoginAuthLoading } =
    useOAuth2PasswordLogin({
      onSuccess: handleLoginSuccess,
      onError: message => {
        setLoginError(message)
      },
    })

  const handleNewPasswordSuccess = useCallback(
    (username: string, newPassword: string) => {
      setLoginError(null)
      submitPassword(username, newPassword)
    },
    [submitPassword]
  )

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
        submitPassword={
          isChoosingNewPassword ? submitNewPassword : submitPassword
        }
        isAuthLoading={
          isChoosingNewPassword
            ? isSetNewPasswordLoading || isLoginAuthLoading
            : isLoginAuthLoading
        }
        isPasswordResetRequired={isChoosingNewPassword}
        initialUsername={initialUsername}
        loginError={loginError}
        onClearLoginError={() => {
          setLoginError(null)
        }}
        passwordComplexity={passwordComplexity}
        onCancel={handleCancel}
      />
      {passwordUpdatedUsername != null ? (
        <Toast
          id={passwordUpdatedToastId}
          message={t('on_device_login_password_updated') as string}
          type={SUCCESS_TOAST}
          displayType="odd"
          duration={PASSWORD_UPDATED_TOAST_MS}
          position={POSITION_FIXED}
          right={SPACING.spacing32}
          bottom={SPACING.spacing32}
          zIndex={10002}
          onClose={() => {
            finishModal(passwordUpdatedUsername)
          }}
        />
      ) : null}
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
