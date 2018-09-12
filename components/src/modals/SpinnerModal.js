// @flow
// titled modal page component
import * as React from 'react'
import cx from 'classnames'
import {Overlay} from './'
import {Icon} from '../icons'

import styles from './modals.css'

type Props = {
  /** Additional/Override style */
  contentsClassName?: string,
  /** Optional message to display as italic text below spinner */
  message?: string,
}

/**
 * Spinner Modal with no background and optional message
 */
export default function SpinnerModal (props: Props) {
  return (
    <div className={styles.modal}>
      <Overlay />
      <div className={cx(styles.spinner_modal_contents, props.contentsClassName)}>
        <Icon name='ot-spinner' className={styles.spinner_modal_icon} spin/>
        <p>{props.message}</p>
      </div>
    </div>
  )
}
