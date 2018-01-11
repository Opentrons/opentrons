// @flow
// collapsable side panel
import * as React from 'react'
import classnames from 'classnames'

import {IconButton} from '../buttons'
import {CLOSE} from '../icons'
import styles from './sidepanel.css'

type SidePanelProps= {
  title: string,
  children: React.Node,
  isOpen?: boolean,
  onClick?: (event: SyntheticEvent<>) => void
}

export default function SidePanel (props: SidePanelProps) {
  const open = props.onClick
    ? props.isOpen
    : true
  const closeButton = props.onClick && (
    <IconButton
      className={styles.button_close}
      iconName={CLOSE}
      onClick={props.onClick}
    />
  )
  const className = classnames(styles.panel, {[styles.closed]: !open})

  return (
    <div className={className}>
      <div className={styles.title_bar}>
        <h2 className={styles.title}>
          {props.title}
        </h2>
        {closeButton}
      </div>
      <div className={styles.panel_contents}>
        {props.children}
      </div>
    </div>
  )
}
