// @flow
// titled modal page component
import * as React from 'react'

import type { TitleBarProps } from '../structure'
import { TitleBar } from '../structure'
import styles from './modals.css'
import { SpinnerModal } from './SpinnerModal'

// TODO(mc, 2018-06-20): s/titleBar/titleBarProps
export type SpinnerModalPageProps = {|
  /** Props for title bar at top of modal page */
  titleBar: TitleBarProps,
  /** Additional/Override style */
  contentsClassName?: string,
  /** Optional message to display as italic text below spinner */
  message?: string,
|}

/**
 * Spinner Modal variant with TitleBar
 */
export function SpinnerModalPage(props: SpinnerModalPageProps): React.Node {
  const { titleBar, ...spinnerModalProps } = props

  return (
    <div className={styles.modal}>
      <TitleBar {...titleBar} className={styles.title_bar} />
      <SpinnerModal {...spinnerModalProps} />
    </div>
  )
}
