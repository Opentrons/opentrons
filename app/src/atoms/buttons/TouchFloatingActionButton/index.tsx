import { COLORS, Icon, StyledText } from '@opentrons/components'

import styles from './touchfloatingactionbutton.module.css'

import type { ComponentPropsWithoutRef } from 'react'
import type { IconName } from '@opentrons/components'

interface TouchFloatingActionButtonProps extends ComponentPropsWithoutRef<'button'> {
  buttonText: string
  'aria-label': string
  disabled?: boolean
  iconName?: IconName
}

export function TouchFloatingActionButton(
  props: TouchFloatingActionButtonProps
): JSX.Element {
  const {
    buttonText,
    'aria-label': ariaLabel,
    disabled = false,
    iconName,
    ...restProps
  } = props

  const contentColor = disabled ? COLORS.grey50 : COLORS.white

  return (
    <button
      type="button"
      className={styles.floating_button_style}
      aria-label={ariaLabel}
      disabled={disabled}
      {...restProps}
    >
      <div className={styles.content_container}>
        {iconName != null ? (
          <Icon color={contentColor} name={iconName} size="3rem" />
        ) : null}
        <StyledText oddStyle="level4HeaderSemiBold">{buttonText}</StyledText>
      </div>
    </button>
  )
}
