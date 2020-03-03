// @flow
// TODO: BC: 2019-06-13 unused? can be removed?
// modal component for ReviewDeckModal of labware calibration page
import * as React from 'react'

import { Overlay, TitleBar } from '@opentrons/components'
import { SessionHeader } from '../SessionHeader'

import styles from './styles.css'

type Props = {|
  children: React.Node,
|}

const titleBarProps = {
  title: <SessionHeader />,
  className: styles.title_bar,
}

export function Modal(props: Props) {
  return (
    <div className={styles.modal}>
      <Overlay />
      <TitleBar {...titleBarProps} />
      {props.children}
    </div>
  )
}
