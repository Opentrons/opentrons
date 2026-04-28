import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { LoggedOutOverlay } from '/app/molecules/LoggedOutOverlay'
import { getLocalRobot } from '/app/redux/discovery'
import {
  getIsLoggedInToLocalRobot,
  logInOrRefresh,
} from '/app/redux/robot-auth'
import { useOAuth2PasswordLogin } from '/app/resources/auth'

import { OnDeviceLogin } from './index'
import styles from './OnDeviceLoginOverlayProvider.module.css'

import type { ReactNode } from 'react'
import type { OAuth2TokenResponse } from '@opentrons/api-client'
import type { State } from '/app/redux/types'
import type { LoginStep } from './index'

export interface OnDeviceLoginModalContextValue {
  openLoginModal: () => void
  closeLoginModal: () => void
}

const OnDeviceLoginContext =
  createContext<OnDeviceLoginModalContextValue | null>(null)

/**
 * This component does a few things when access control is enabled on the robot:
 *
 * - As a context provider, it passes context down to children to let them open/close
 *   the login page.
 *
 * - It does the actual rendering of the login page (when it's open). We implement
 *   it as an overlay, as opposed to a react-router-dom page, in order to preserve the
 *   local component state of the main page underneath it.
 *
 * - It also renders the "logged out" overlay (when the user is logged out).
 */
export function OnDeviceLoginOverlayProvider({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const openLoginModal = useCallback(() => {
    setLoginModalOpen(true)
  }, [])
  const closeLoginModal = useCallback(() => {
    setLoginModalOpen(false)
  }, [])

  const shouldShowLoggedOutOverlay =
    useShouldShowLoggedOutOverlay(loginModalOpen)

  const value = useMemo(
    (): OnDeviceLoginModalContextValue => ({
      openLoginModal,
      closeLoginModal,
    }),
    [openLoginModal, closeLoginModal]
  )

  return (
    <OnDeviceLoginContext.Provider value={value}>
      {children}
      {loginModalOpen
        ? createPortal(
            <LoginOverlay onDismiss={closeLoginModal} />,
            getTopPortalEl()
          )
        : null}
      {shouldShowLoggedOutOverlay && (
        <LoggedOutOverlay onClick={openLoginModal} />
      )}
    </OnDeviceLoginContext.Provider>
  )
}

interface LoginOverlayProps {
  onDismiss: () => void
}

function LoginOverlay(props: LoginOverlayProps): JSX.Element {
  return (
    <div className={styles.overlay}>
      <LoginOverlayBody {...props} />
    </div>
  )
}

function LoginOverlayBody({ onDismiss }: LoginOverlayProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [step, setStep] = useState<LoginStep>('username')
  const [loginError, setLoginError] = useState<string | null>(null)

  const storeLoginState = useStoreLoginState()

  const { submitPassword, isAuthLoading } = useOAuth2PasswordLogin({
    onSuccess: (username, response) => {
      setLoginError(null)
      storeLoginState(username, response)
      onDismiss()
    },
    onError: () => {
      setLoginError(t('on_device_login_error_incorrect') as string)
    },
  })

  return (
    <OnDeviceLogin
      step={step}
      onStepChange={setStep}
      submitPassword={submitPassword}
      isAuthLoading={isAuthLoading}
      loginError={loginError}
      onClearLoginError={() => {
        setLoginError(null)
      }}
      onCancel={onDismiss}
    />
  )
}

export function useOnDeviceLoginModal(): OnDeviceLoginModalContextValue {
  const ctx = useContext(OnDeviceLoginContext)
  if (ctx == null) {
    throw new Error(
      'useOnDeviceLoginModal must be used within OnDeviceLoginOverlayProvider'
    )
  }
  return ctx
}

/** Returns whether the logged-out overlay should be shown. */
function useShouldShowLoggedOutOverlay(isShowingLoginPage: boolean): boolean {
  const accessControlEnabledQuery = useAccessControlEnabledQuery()
  const isLoggedIn = useSelector(getIsLoggedInToLocalRobot)
  const shouldShowLoggedOutOverlay =
    accessControlEnabledQuery.data != null &&
    accessControlEnabledQuery.data.data.accessControlEnabled &&
    !isLoggedIn &&
    !isShowingLoginPage
  return shouldShowLoggedOutOverlay
}

/** Returns a function that updates client-side state to reflect a successful login. */
function useStoreLoginState(): (
  username: string,
  successfulLoginResponse: OAuth2TokenResponse
) => void {
  const dispatch = useDispatch()

  const localRobotName = useSelector(
    (state: State) => getLocalRobot(state)?.name ?? null
  )

  const storeLoginState = useCallback(
    (username: string, successfulLoginResponse: OAuth2TokenResponse): void => {
      if (localRobotName == null) {
        console.warn("Couldn't identify the local robot.")
        return
      }
      if (successfulLoginResponse.token_type !== 'Bearer') {
        console.warn(
          'The server gave us an unrecognized token type:',
          successfulLoginResponse.token_type
        )
        return
      }

      dispatch(
        logInOrRefresh({
          username,
          robotName: localRobotName,
          accessToken: successfulLoginResponse.access_token,
          refreshToken: successfulLoginResponse.refresh_token ?? null,
          expiresAt:
            successfulLoginResponse.expires_in == null
              ? null
              : Date.now() + successfulLoginResponse.expires_in * 1000,
        })
      )
    },
    [dispatch, localRobotName]
  )

  return storeLoginState
}
