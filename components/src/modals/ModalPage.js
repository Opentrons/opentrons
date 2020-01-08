// @flow
// titled modal page component
import * as React from 'react'
import cx from 'classnames'
import { Overlay } from './'
import { TitleBar, type TitleBarProps } from '../structure'

import styles from './modals.css'

type Props = {|
  /** Props for title bar at top of modal page */
  titleBar: TitleBarProps,
  contentsClassName?: string,
  heading?: React.Node,
  children?: React.Node,
|}

export default function ModalPage(props: Props) {
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
