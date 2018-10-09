// @flow
// list of robots
import * as React from 'react'
import styles from './styles.css'

type ListProps = {
  children: React.Node,
}

export default function RobotList (props: ListProps) {
  return <ol className={styles.robot_list}>{props.children}</ol>
}
