import clsx from 'clsx'

import { StyledText } from '@opentrons/components'

import styles from './wizardbodytext.module.css'

import type { ComponentProps } from 'react'

export type WizardBodyTextProps = ComponentProps<typeof StyledText>

/**
 * Wizard step body copy with shared desktop/ODD typography.
 * Prefer this over `styled(StyledText)` for BODY_STYLE.
 */
export function WizardBodyText({
  className,
  ...props
}: WizardBodyTextProps): JSX.Element {
  return <StyledText {...props} className={clsx(styles.body, className)} />
}
