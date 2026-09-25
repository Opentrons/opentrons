import { useCallback, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import clsx from 'clsx'

import { getUserLoginStatus, validateSelfPassword } from '@opentrons/api-client'
import {
  POSITION_FIXED,
  SPACING,
  SUCCESS_TOAST,
  Toast,
} from '@opentrons/components'
import { useAuthSettingsQuery, useHost } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { getLocalRobot } from '/app/redux/discovery'
import { logOut, useUsernameForRobot } from '/app/redux/robot-auth'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  DEFAULT_MIN_PASSWORD_LENGTH,
  mapSetNewPasswordError,
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'

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
    const dispatch = useDispatch()
    const { t } = useTranslation(['access_control', 'device_settings'])
    const passwordUpdatedToastId = useId()
    const host = useHost()
    const passwordSetAwaitingLoginRef = useRef(false)
    const [phase, setPhase] = useState<LoginModalPhase>('login')
    const [step, setStep] = useState<LoginStep>('username')
    const [loginError, setLoginError] = useState<string | null>(null)
    const [loginUsername, setLoginUsername] = useState<string | undefined>(
      undefined
    )
    const [loginResetPassword, setLoginResetPassword] = useState(false)
    const [isFetchingLoginStatus, setIsFetchingLoginStatus] = useState(false)
    const [isValidatingNewPassword, setIsValidatingNewPassword] =
      useState(false)
    const [showPasswordUpdatedToast, setShowPasswordUpdatedToast] =
      useState(false)
    const storeLoginState = useStoreLoginState()
    const localRobotName = useSelector(
      (state: State) => getLocalRobot(state)?.name ?? null
    )
    const loggedInUsername = useUsernameForRobot(localRobotName)

    const isChoosingNewPassword = phase === 'chooseNewPassword'

    const finishModal = useCallback(
      (username: string): void => {
        passwordSetAwaitingLoginRef.current = false
        modal.resolve({ username })
        modal.remove()
      },
      [modal]
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
          finishModal(username)
        }
      },
      [finishModal, storeLoginState, localRobotName]
    )

    const dismissModal = useCallback((): void => {
      // Password was changed under a limited-scope session; if the user backs
      // out before signing in with the new password, clear that session.
      if (passwordSetAwaitingLoginRef.current && localRobotName != null) {
        dispatch(logOut({ robotName: localRobotName }))
      }
      passwordSetAwaitingLoginRef.current = false
      modal.resolve(null)
      modal.remove()
    }, [dispatch, localRobotName, modal])

    const handleUsernameSubmit = async (username: string): Promise<void> => {
      setLoginUsername(username)
      if (host == null) return

      setIsFetchingLoginStatus(true)
      try {
        const response = await getUserLoginStatus(host, username)
        setLoginResetPassword(response.data.data.reason === 'temporaryPassword')
      } catch {
        setLoginResetPassword(false)
      } finally {
        setIsFetchingLoginStatus(false)
      }
    }

    const handleValidateNewPassword = async (
      password: string
    ): Promise<string | null> => {
      if (host == null) {
        return t('set_new_password_error_session_expired') as string
      }

      setIsValidatingNewPassword(true)
      try {
        await validateSelfPassword(host, { data: { password } })
        return null
      } catch (error: unknown) {
        return mapSetNewPasswordError(error, t)
      } finally {
        setIsValidatingNewPassword(false)
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
      (username: string, _newPassword: string) => {
        // Clear the limited-scope temp-password session (same as desktop)
        // before the user signs in with their new password.
        passwordSetAwaitingLoginRef.current = true
        if (localRobotName != null) {
          dispatch(logOut({ robotName: localRobotName }))
        }
        setLoginError(null)
        setLoginResetPassword(false)
        setLoginUsername(username)
        setPhase('login')
        setStep('password')
        setShowPasswordUpdatedToast(true)
      },
      [dispatch, localRobotName]
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
          onValidateNewPassword={
            isChoosingNewPassword ? handleValidateNewPassword : undefined
          }
          submitPassword={
            isChoosingNewPassword ? submitNewPassword : submitPassword
          }
          isAuthLoading={
            isChoosingNewPassword
              ? isSetNewPasswordLoading || isValidatingNewPassword
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
        {showPasswordUpdatedToast ? (
          <Toast
            id={passwordUpdatedToastId}
            message={t('on_device_login_password_updated') as string}
            type={SUCCESS_TOAST}
            displayType="odd"
            position={POSITION_FIXED}
            right={SPACING.spacing32}
            bottom={SPACING.spacing32}
            onClose={() => {
              setShowPasswordUpdatedToast(false)
            }}
          />
        ) : null}
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
