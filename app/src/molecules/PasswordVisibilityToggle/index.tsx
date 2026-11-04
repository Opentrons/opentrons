import { useTranslation } from 'react-i18next'

import { Icon, StyledText } from '@opentrons/components'

import styles from './passwordvisibilitytoggle.module.css'

interface PasswordVisibilityToggleProps {
  /** Whether the password is currently visible (i.e. input type="text"). */
  isVisible: boolean
  /** Called when the user taps the toggle. The caller owns visibility state and
   * is responsible for refocusing the input if needed. */
  onToggle: () => void
}

/**
 * Touch-screen "Show / Hide" button rendered next to a password input on the
 * ODD. Used by `OnDeviceLogin` and `SetWifiCred` to keep the eye-icon control
 * outside the input field itself.
 */
export function PasswordVisibilityToggle({
  isVisible,
  onToggle,
}: PasswordVisibilityToggleProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  return (
    <button type="button" onClick={onToggle} className={styles.toggle_button}>
      <Icon name={isVisible ? 'eye-slash' : 'eye'} size="3rem" />
      <StyledText oddStyle="bodyTextSemiBold">
        {isVisible ? t('hide') : t('show')}
      </StyledText>
    </button>
  )
}
