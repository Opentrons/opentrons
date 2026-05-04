import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { useOAuth2PasswordLogin } from '/app/resources/auth'

import { useStoreLoginState } from './hooks'
import { OnDeviceLogin } from './index'
import styles from './OnDeviceLoginOverlayProvider.module.css'

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

  const { submitPassword, isAuthLoading } = useOAuth2PasswordLogin({
    onSuccess: (username, response) => {
      setLoginError(null)
      storeLoginState(username, response)
      const result: LoginModalResult = { username }
      void modal.hide()
      modal.resolve(result)
    },
    onError: () => {
      setLoginError(t('on_device_login_error_incorrect') as string)
    },
  })

  return (
    <div className={styles.overlay}>
      <OnDeviceLogin
        step={step}
        onStepChange={setStep}
        submitPassword={submitPassword}
        isAuthLoading={isAuthLoading}
        loginError={loginError}
        onClearLoginError={() => {
          setLoginError(null)
        }}
        onCancel={() => {
          void modal.hide()
          modal.resolve(null)
        }}
      />
    </div>
  )
})

/**
 * Imperatively open the login overlay and await the result.
 *
 * Resolves with `{ username }` once the user logs in, or `null` if the user
 * cancels. Used by the access-control gate (`useGuardedAction`) when an action
 * requires login but the current robot session is logged out.
 *
 * Distinct from `OnDeviceLoginOverlayProvider`, which renders the persistent
 * logged-out overlay. This NiceModal is for ad-hoc, one-shot login prompts
 * triggered by a user action.
 */
export const showLoginModal = (): Promise<LoginModalResult | null> =>
  NiceModal.show(LoginModalImpl) as Promise<LoginModalResult | null>
