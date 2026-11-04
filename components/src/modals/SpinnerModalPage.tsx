// titled modal page component
import { TitleBar } from '../structure'
import styles from './modals.module.css'
import { SpinnerModal } from './SpinnerModal'

import type { ComponentProps, ReactNode } from 'react'
import type { TitleBarProps } from '../structure'

// TODO(mc, 2018-06-20): s/titleBar/titleBarProps
export interface SpinnerModalPageProps extends ComponentProps<
  typeof SpinnerModal
> {
  /** Props for title bar at top of modal page */
  titleBar: TitleBarProps
}

/**
 * @deprecated use Modal instead
 * Spinner Modal variant with TitleBar
 */
export function SpinnerModalPage(props: SpinnerModalPageProps): ReactNode {
  const { titleBar, ...spinnerModalProps } = props

  return (
    <div className={styles.modal}>
      <TitleBar {...titleBar} className={styles.title_bar} />
      <SpinnerModal {...spinnerModalProps} />
    </div>
  )
}
