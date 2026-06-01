import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import {
  useLocalRobotAuthSelf,
  useOAuth2PasswordLogin,
} from '/app/resources/auth'

import { useStoreLoginState } from './hooks'
import { OnDeviceLogin } from './index'
import styles from './OnDeviceLogin.module.css'

import type { LoginStep } from './index'

export interface LoginModalResult {
  username: string
}

const LoginModalImpl = NiceModal.create((): JSX.Element => {
  const modal = useModal()
  const { t } = useTranslation('device_settings')
  const [step, setStep] = useState<LoginStep>('username')
  const [loginError, setLoginError] = useState<string | null>(null)
  const storeLoginState = useStoreLoginState()

  const { username: currentUsername, resetPasswordRequired } =
    useLocalRobotAuthSelf()

  useEffect(() => {
    if (
      resetPasswordRequired &&
      currentUsername != null &&
      currentUsername !== ''
    ) {
      setStep('password')
    }
  }, [resetPasswordRequired, currentUsername])

  const { submitPassword, isAuthLoading } = useOAuth2PasswordLogin({
    onSuccess: (username, response) => {
      setLoginError(null)
      storeLoginState(username, response)
      const result: LoginModalResult = { username }
      modal.resolve(result)
      modal.remove()
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
    resetPasswordRequired && currentUsername != null
      ? currentUsername
      : undefined

  return (
    <div className={styles.overlay}>
      <OnDeviceLogin
        step={step}
        onStepChange={setStep}
        submitPassword={submitPassword}
        isAuthLoading={isAuthLoading}
        isPasswordResetRequired={resetPasswordRequired}
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
