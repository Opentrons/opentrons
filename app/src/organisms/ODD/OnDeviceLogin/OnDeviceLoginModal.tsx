import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { getTopPortalEl } from '/app/App/portal'
import { useOAuth2PasswordLogin } from '/app/resources/auth'

import { getSafePostLoginPath } from './getSafePostLoginPath'
import { OnDeviceLogin } from './index'
import styles from './OnDeviceLoginModal.module.css'

import type { LoginStep } from './index'

export interface OnDeviceLoginModalProps {
  /** In-app path to navigate to after successful login (validated). */
  from?: string
}

/**
 * Full-screen login layer above ODD routes so the current screen stays mounted.
 * Rendered via NiceModal so the top-level `<NiceModal.Provider>` is the only
 * wiring the app tree needs.
 */
const OnDeviceLoginModal = NiceModal.create(
  ({ from }: OnDeviceLoginModalProps): JSX.Element | null => {
    const modal = useModal()
    const navigate = useNavigate()
    const { t } = useTranslation('device_settings')
    const [step, setStep] = useState<LoginStep>('username')
    const [loginError, setLoginError] = useState<string | null>(null)
    const returnToPath = getSafePostLoginPath(from)

    const { submitPassword, isAuthLoading } = useOAuth2PasswordLogin({
      onSuccess: () => {
        setLoginError(null)
        if (returnToPath != null) {
          navigate(returnToPath, { replace: true })
        }
        modal.remove()
      },
      onError: () => {
        setLoginError(t('on_device_login_error_incorrect') as string)
      },
    })

    if (!modal.visible) return null

    return createPortal(
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
            modal.remove()
          }}
        />
      </div>,
      getTopPortalEl()
    )
  }
)

/**
 * Imperatively open the ODD login overlay. Returns a promise that resolves
 * when the modal is dismissed (either after a successful login or cancel).
 */
export const handleOnDeviceLoginModal = (
  props: OnDeviceLoginModalProps = {}
): Promise<unknown> => NiceModal.show(OnDeviceLoginModal, props)

export { OnDeviceLoginModal }
