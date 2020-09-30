// @flow
// collapsable side panel
import * as React from 'react'
import styles from './SidePanel.css'

export type SidePanelProps = {|
  title: string,
  children: React.Node,
|}

export function SidePanel(props: SidePanelProps): React.Node {
  return (
    <div className={styles.panel}>
      <div className={styles.title_bar}>
        <h2 className={styles.title}>{props.title}</h2>
      </div>
      <div className={styles.panel_contents}>{props.children}</div>
    </div>
  )
}
