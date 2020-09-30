// @flow
// titled modal page component
import * as React from 'react'
import cx from 'classnames'
import { Overlay } from './Overlay'
import { Icon } from '../icons'

import styles from './modals.css'

export type SpinnerModalProps = {|
  /** Additional/Override style */
  contentsClassName?: string,
  /** Optional message to display as italic text below spinner */
  message?: string,
  /** lightens overlay (alert modal over existing modal) */
  alertOverlay?: boolean,
|}

/**
 * Spinner Modal with no background and optional message
 */
export function SpinnerModal(props: SpinnerModalProps): React.Node {
  return (
    <div className={styles.modal}>
      <Overlay alertOverlay={props.alertOverlay} />
      <div
        className={cx(styles.spinner_modal_contents, props.contentsClassName)}
      >
        <Icon name="ot-spinner" className={styles.spinner_modal_icon} spin />
        <p>{props.message}</p>
      </div>
    </div>
  )
}
