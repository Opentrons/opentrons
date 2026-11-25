import { Icon } from '@opentrons/components'

import styles from './loggedoutoverlay.module.css'

import type { ReactNode } from 'react'

export interface LoggedOutOverlayProps {
  onClick?: () => void
}

/**
 * A semi-transparent overlay for when the on-device display is locked.
 *
 * This renders with `position: fixed` to fill the viewport, with a high z-index.
 */
export function LoggedOutOverlay(props: LoggedOutOverlayProps): ReactNode {
  const { onClick } = props

  // todo(mm, 2026-04-16): Handle keyboard interaction.
  // Trap focus so the user can't use the keyboard to navigate underneath the overlay.

  return (
    <div
      className={styles.overlay}
      onClick={onClick}
      role="dialog"
      aria-modal="true"
      aria-label="Logged out"
    >
      <button className={styles.acm_badge} type="button" onClick={onClick}>
        <Icon name="acm" className={styles.acm_icon} />
      </button>
    </div>
  )
}
