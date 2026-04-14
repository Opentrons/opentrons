import { Icon } from '@opentrons/components'

import styles from './loggedoutoverlay.module.css'

export interface LoggedOutOverlayProps {
  onClick?: () => void
}

/**
 * A semi-transparent overlay for when the on-device display is locked.
 *
 * Fills the dimensions of the parent component.
 */
export function LoggedOutOverlay(props: LoggedOutOverlayProps): JSX.Element {
  const { onClick } = props

  return (
    <div className={styles.overlay} onClick={onClick}>
      <div className={styles.acm_badge}>
        <Icon name="acm" className={styles.acm_icon} />
      </div>
    </div>
  )
}
