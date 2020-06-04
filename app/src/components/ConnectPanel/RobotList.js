// @flow
// list of robots
import * as React from 'react'
import styles from './styles.css'

export type RobotListProps = {|
  children: React.Node,
|}

export function RobotList(props: RobotListProps): React.Node {
  return <ol className={styles.robot_list}>{props.children}</ol>
}
