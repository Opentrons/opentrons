import { useTranslation } from 'react-i18next'

import { Icon, StyledText } from '@opentrons/components'

import styles from './passwordvisibilitytoggle.module.css'

interface PasswordVisibilityToggleProps {
  /** Whether the password is currently visible (i.e. input type="text"). */
  isVisible: boolean
  /** Called when the user taps the toggle. */
  onToggle: () => void
}

/**
 * On-device display "Show / Hide" button rendered next to a password input.
 */
export function PasswordVisibilityToggle({
  isVisible,
  onToggle,
}: PasswordVisibilityToggleProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  return (
    <button
      type="button"
      onMouseDown={e => {
        // This prevents focus from moving from the password field to this toggle button,
        // but lets the click event go through.
        e.preventDefault()
      }}
      onClick={onToggle}
      className={styles.toggle_button}
    >
      <Icon name={isVisible ? 'eye-slash' : 'eye'} size="3rem" />
      <StyledText oddStyle="bodyTextSemiBold">
        {isVisible ? t('hide') : t('show')}
      </StyledText>
    </button>
  )
}
