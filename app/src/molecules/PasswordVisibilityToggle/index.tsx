import { useTranslation } from 'react-i18next'

import { Icon, StyledText } from '@opentrons/components'

import styles from './passwordvisibilitytoggle.module.css'

import type { MouseEvent, ReactNode } from 'react'

interface PasswordVisibilityToggleProps {
  /** Whether the password is currently visible (i.e. input type="text"). */
  isVisible: boolean
  /** Called when the user taps the toggle. */
  onToggle: () => void
  /** Render only the eye icon, for use inside an InputField. */
  iconOnly?: boolean
}

/**
 * "Show / Hide" control for a password input.
 * Use `iconOnly` to place the eye icon inside a desktop InputField.
 */
export function PasswordVisibilityToggle({
  isVisible,
  onToggle,
  iconOnly = false,
}: PasswordVisibilityToggleProps): ReactNode {
  const { t } = useTranslation('device_settings')
  const iconName = isVisible ? 'eye-slash' : 'eye'

  const handleMouseDown = (e: MouseEvent<HTMLButtonElement>): void => {
    // This prevents focus from moving from the password field to this toggle button,
    // but lets the click event go through.
    e.preventDefault()
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        aria-label={t('toggle_password_visibility')}
        aria-pressed={isVisible}
        onMouseDown={handleMouseDown}
        onClick={onToggle}
        className={styles.icon_only_button}
      >
        <Icon name={iconName} className={styles.icon_only} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      onClick={onToggle}
      className={styles.toggle_button}
    >
      <Icon name={iconName} className={styles.icon} />
      <StyledText
        oddStyle="bodyTextSemiBold"
        desktopStyle="bodyDefaultSemiBold"
      >
        {isVisible ? t('hide') : t('show')}
      </StyledText>
    </button>
  )
}
