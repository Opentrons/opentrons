// @flow
// list of robots
import * as React from 'react'
import styles from './connect-panel.css'

type ListProps = {
  children: React.Node,
}

export default function RobotList (props: ListProps) {
  return <ol className={styles.robot_list}>{props.children}</ol>
}
