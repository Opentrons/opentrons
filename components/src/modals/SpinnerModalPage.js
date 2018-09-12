// @flow
// titled modal page component
import * as React from 'react'
import {SpinnerModal} from './'
import {TitleBar, type TitleBarProps} from '../structure'

import styles from './modals.css'

// TODO(mc, 2018-06-20): s/titleBar/titleBarProps
type Props = {
  /** Props for title bar at top of modal page */
  titleBar: TitleBarProps,
  /** Additional/Override style */
  contentsClassName?: string,
  /** Optional message to display as italic text below spinner */
  message?: string,
}

/**
 * Spinner Modal variant with TitleBar
 */
export default function SpinnerModalPage (props: Props) {
  const {titleBar} = props

  return (
    <div className={styles.modal}>
      <TitleBar {...titleBar} className={styles.title_bar} />
      <SpinnerModal {...props} />
    </div>
  )
}
