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
 * Full-screen login layer above ODD routes so the current screen stays mounted.
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
            <div className={styles.overlay}>
              <LoginOverlayBody
                onDismiss={closeLoginModal}
                returnToPath={returnToPath}
              />
            </div>,
            getTopPortalEl()
          )
        : null}
    </OnDeviceLoginContext.Provider>
  )
}

interface LoginOverlayBodyProps {
  onDismiss: () => void
  returnToPath: string | null
}

function LoginOverlayBody({
  onDismiss,
  returnToPath,
}: LoginOverlayBodyProps): JSX.Element {
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
