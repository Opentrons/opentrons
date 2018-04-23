// @flow
// titled modal page component
import * as React from 'react'
import cx from 'classnames'
import {Overlay} from './'
import {TitleBar, type TitleBarProps} from '../structure'
import {Icon} from '../icons'

import styles from './modals.css'

type Props = {
  /** Props for title bar at top of modal page */
  titleBar: TitleBarProps,
  /** Additional/Override style */
  contentsClassName?: string,
  /** Optional message to display as italic text below spinner */
  message?: string
}

export default function SpinnerModalPage (props: Props) {
  const {titleBar} = props

  return (
    <div className={styles.modal}>
      <Overlay />
      <TitleBar {...titleBar} className={styles.title_bar} />
      <div className={cx(styles.spinner_modal_contents, props.contentsClassName)}>
        <Icon name='ot-spinner' className={styles.spinner_modal_icon} spin/>
        <p>{props.message}</p>
      </div>
    </div>
  )
}
