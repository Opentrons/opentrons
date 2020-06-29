// @flow
// titled modal page component
import cx from 'classnames'
import * as React from 'react'

import type { TitleBarProps } from '../structure'
import { TitleBar } from '../structure'
import styles from './modals.css'
import { Overlay } from './Overlay'

export type ModalPageProps = {|
  /** Props for title bar at top of modal page */
  titleBar: TitleBarProps,
  contentsClassName?: string,
  heading?: React.Node,
  children?: React.Node,
|}

export function ModalPage(props: ModalPageProps): React.Node {
  const { titleBar, heading } = props

  return (
    <div className={styles.modal_page}>
      <Overlay />
      <TitleBar {...titleBar} className={styles.title_bar} />
      <div className={cx(styles.modal_page_contents, props.contentsClassName)}>
        {heading && <h3 className={styles.modal_heading}>{heading}</h3>}
        {props.children}
      </div>
    </div>
  )
}
