import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { getTopPortalEl } from '/app/App/portal'
import { useOAuth2PasswordLogin } from '/app/resources/auth'

import { getSafePostLoginPath } from './getSafePostLoginPath'
import { OnDeviceLogin } from './index'
import styles from './OnDeviceLoginOverlayProvider.module.css'

import type { ReactNode } from 'react'
import type { LoginStep } from './index'

export interface OpenOnDeviceLoginOptions {
  /** In-app path to navigate to after successful login (validated). */
  from?: string
}

export interface OnDeviceLoginModalContextValue {
  openLoginModal: (options?: OpenOnDeviceLoginOptions) => void
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
  const [open, setOpen] = useState(false)
  const [returnToPath, setReturnToPath] = useState<string | null>(null)

  const openLoginModal = useCallback((options?: OpenOnDeviceLoginOptions) => {
    setReturnToPath(getSafePostLoginPath(options?.from))
    setOpen(true)
  }, [])

  const closeLoginModal = useCallback(() => {
    setOpen(false)
    setReturnToPath(null)
  }, [])

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
      {open
        ? createPortal(
            <LoginOverlay
              onDismiss={closeLoginModal}
              returnToPath={returnToPath}
            />,
            getTopPortalEl()
          )
        : null}
    </OnDeviceLoginContext.Provider>
  )
}

interface LoginOverlayProps {
  onDismiss: () => void
  returnToPath: string | null
}

function LoginOverlay(props: LoginOverlayProps): JSX.Element {
  return (
    <div className={styles.overlay}>
      <LoginOverlayBody {...props} />
    </div>
  )
}

function LoginOverlayBody({
  onDismiss,
  returnToPath,
}: LoginOverlayProps): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation('device_settings')
  const [step, setStep] = useState<LoginStep>('username')
  const [loginError, setLoginError] = useState<string | null>(null)
  const { submitPassword, isAuthLoading } = useOAuth2PasswordLogin({
    onSuccess: () => {
      setLoginError(null)
      if (returnToPath != null) {
        navigate(returnToPath, { replace: true })
      }
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
