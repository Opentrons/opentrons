// @flow
// titled modal page component
import * as React from 'react'
import cx from 'classnames'
import {Overlay} from './'
import {TitleBar, type TitleBarProps} from '../structure'

import styles from './modals.css'

type Props = {
  /** Props for title bar at top of modal page */
  titleBar: TitleBarProps,
  contentsClassName?: string,
  children?: React.Node
}

export default function ModalPage (props: Props) {
  const {titleBar} = props

  return (
    <div className={styles.modal}>
      <Overlay />
      <TitleBar {...titleBar} className={styles.title_bar} />
      <div className={cx(styles.modal_contents, props.contentsClassName)}>
        {props.children}
      </div>
    </div>
  )
}
