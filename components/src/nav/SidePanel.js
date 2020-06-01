// @flow
// collapsable side panel
import * as React from 'react'
import classnames from 'classnames'
import { IconButton } from '../buttons'
import styles from './SidePanel.css'

export type SidePanelProps = {|
  title: string,
  children: React.Node,
  isClosed?: boolean,
  onCloseClick?: (event: SyntheticMouseEvent<>) => mixed,
  onMouseEnter?: (event: SyntheticMouseEvent<>) => mixed,
  onMouseLeave?: (event: SyntheticMouseEvent<>) => mixed,
|}

export function SidePanel(props: SidePanelProps): React.Node {
  const open = !props.isClosed || props.onCloseClick == null
  const closeButton = props.onCloseClick && (
    <IconButton
      title="close panel"
      onClick={props.onCloseClick}
      className={styles.button_close}
      name="close"
    />
  )
  const className = classnames(styles.panel, { [styles.closed]: !open })

  return (
    <div
      className={className}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      <div className={styles.title_bar}>
        <h2 className={styles.title}>{props.title}</h2>
        {closeButton}
      </div>
      <div className={styles.panel_contents}>{props.children}</div>
    </div>
  )
}
