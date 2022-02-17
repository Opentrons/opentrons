// titled modal page component
import * as React from 'react'

import { DeprecatedTitleBar } from '../structure'
import { SpinnerModal } from './SpinnerModal'
import styles from './modals.css'

import type { DeprecatedTitleBarProps } from '../structure'

// TODO(mc, 2018-06-20): s/titleBar/titleBarProps
export interface SpinnerModalPageProps
  extends React.ComponentProps<typeof SpinnerModal> {
  /** Props for title bar at top of modal page */
  titleBar: DeprecatedTitleBarProps
}

/**
 * Spinner Modal variant with TitleBar
 */
export function SpinnerModalPage(props: SpinnerModalPageProps): JSX.Element {
  const { titleBar, ...spinnerModalProps } = props

  return (
    <div className={styles.modal}>
      <DeprecatedTitleBar {...titleBar} className={styles.title_bar} />
      <SpinnerModal {...spinnerModalProps} />
    </div>
  )
}
