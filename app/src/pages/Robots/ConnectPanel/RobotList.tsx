// list of robots
import * as React from 'react'
import styles from './styles.css'

export interface RobotListProps {
  children: React.ReactNode
}

export function RobotList(props: RobotListProps): React.ReactNode {
  return <ol className={styles.robot_list}>{props.children}</ol>
}
