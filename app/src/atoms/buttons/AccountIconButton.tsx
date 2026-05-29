import { StyledText } from '@opentrons/components'

import styles from './accounticon.module.css'

import type { ComponentProps } from 'react'

interface AccountIconButtonProps {
  initial: string /** A single character to show in the button. */
  onClick?: ComponentProps<'button'>['onClick']
}

export function AccountIconButton(props: AccountIconButtonProps): JSX.Element {
  const { initial, onClick } = props
  // todo(mm, 2026-05-27): Since the button only contains a single letter,
  // do we need some kind of aria label?
  return (
    <button className={styles.button} onClick={onClick} type="button">
      <StyledText desktopStyle="bodyLargeSemiBold">{initial}</StyledText>
    </button>
  )
}
