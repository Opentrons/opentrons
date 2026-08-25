import { COLORS, Icon } from '@opentrons/components'

import styles from './overflowmenubutton.module.css'

import type { ReactNode } from 'react'

interface OverflowMenuButtonProps {
  onClick: () => void
}

export function OverflowMenuButton(props: OverflowMenuButtonProps): ReactNode {
  const { onClick } = props

  return (
    <button
      type="button"
      className={styles.overflow_button}
      aria-label="overflow menu button"
      onClick={onClick}
    >
      <Icon name="overflow-btn-touchscreen" color={COLORS.grey60} />
    </button>
  )
}
