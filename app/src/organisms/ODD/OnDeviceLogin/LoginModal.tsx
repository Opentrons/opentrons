import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import clsx from 'clsx'

import { getUserLoginStatus } from '@opentrons/api-client'
import { useAuthSettingsQuery, useHost } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { getLocalRobot } from '/app/redux/discovery'
import { useUsernameForRobot } from '/app/redux/robot-auth'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  DEFAULT_MIN_PASSWORD_LENGTH,
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'

import { useToaster } from '../../ToasterOven'
import { OnDeviceLogin } from './index'
import styles from './OnDeviceLogin.module.css'

import type { AuthUser, OAuth2TokenResponse } from '@opentrons/api-client'
import type { State } from '/app/redux/types'
import type { LoginStep } from './index'

type LoginModalPhase = 'login' | 'chooseNewPassword'

const LoginModalImpl = NiceModal.create(
  (props: { key?: string }): JSX.Element => {
    const { key } = props
    const modal = useModal()
    const { t } = useTranslation(['access_control'])
    const host = useHost()
    const shouldShowPasswordUpdatedToastRef = useRef(false)
    const [phase, setPhase] = useState<LoginModalPhase>('login')
    const [step, setStep] = useState<LoginStep>('username')
    const [loginError, setLoginError] = useState<string | null>(null)
    const [loginUsername, setLoginUsername] = useState<string | undefined>(
      undefined
    )
    const [loginResetPassword, setLoginResetPassword] = useState(false)
    const [isFetchingLoginStatus, setIsFetchingLoginStatus] = useState(false)
    const storeLoginState = useStoreLoginState()
    const localRobotName = useSelector(
      (state: State) => getLocalRobot(state)?.name ?? null
    )
    const loggedInUsername = useUsernameForRobot(localRobotName)

    const isChoosingNewPassword = phase === 'chooseNewPassword'

    const { makeToast } = useToaster()

    const finishModal = useCallback(
      (
        username: string,
        options?: { showPasswordUpdatedToast?: boolean }
      ): void => {
        if (options?.showPasswordUpdatedToast === true) {
          makeToast('' + t('on_device_login_password_updated'), 'success')
        }

        modal.resolve({ username })
        modal.remove()
      },
      [modal, makeToast, t]
    )

    const handleLoginSuccess = useCallback(
      (
        username: string,
        user: AuthUser,
        response: OAuth2TokenResponse
      ): void => {
        setLoginError(null)
        storeLoginState(localRobotName, user, response)

        if (user.resetPassword) {
          setLoginUsername(username)
          setPhase('chooseNewPassword')
          setStep('password')
        } else {
          finishModal(username, {
            showPasswordUpdatedToast: shouldShowPasswordUpdatedToastRef.current,
          })
          shouldShowPasswordUpdatedToastRef.current = false
        }
      },
      [finishModal, storeLoginState, localRobotName]
    )

    const dismissModal = useCallback((): void => {
      modal.resolve(null)
      modal.remove()
    }, [modal])

    const handleUsernameSubmit = async (username: string): Promise<void> => {
      setLoginUsername(username)
      if (host == null) return

      setIsFetchingLoginStatus(true)
      try {
        const response = await getUserLoginStatus(host, username)
        setLoginResetPassword(response.data.data.resetPassword as boolean)
      } catch {
        setLoginResetPassword(false)
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

    const handleNewPasswordSuccess = useCallback(
      (username: string, newPassword: string) => {
        setLoginError(null)
        shouldShowPasswordUpdatedToastRef.current = true
        setLoginUsername(username)
        submitPassword(username, newPassword)
      },
      [submitPassword]
    )

    const documentationState = useDocumentationState()
    const { submitNewPassword, isLoading: isSetNewPasswordLoading } =
      useSetNewPasswordAndSignIn(documentationState, {
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
      <div
        className={clsx(
          styles.overlay,
          isChoosingNewPassword && styles.overlay_below_documentation
        )}
        key={key}
      >
        <OnDeviceLogin
          key={phase}
          step={step}
          onStepChange={setStep}
          onUsernameSubmit={
            phase === 'login' ? handleUsernameSubmit : undefined
          }
          submitPassword={
            isChoosingNewPassword ? submitNewPassword : submitPassword
          }
          isAuthLoading={
            isChoosingNewPassword
              ? isSetNewPasswordLoading
              : isLoginAuthLoading || isFetchingLoginStatus
          }
          isPasswordResetRequired={isChoosingNewPassword}
          loginResetPassword={loginResetPassword}
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
  }
)

/**
 * Open the login modal and await the result.
 */
export function showLoginModal(props?: {
  key?: string
}): Promise<{ username: string } | null> {
  return NiceModal.show(LoginModalImpl, props ?? {})
}

/**
 * Returns whether the login modal is currently visible.
 */
export function useIsLoginModalOpen(): boolean {
  return useModal(LoginModalImpl).visible
}
