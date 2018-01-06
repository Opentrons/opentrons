// list of robots
import React from 'react'

import styles from './connect-panel.css'

export default function RobotList (props) {
  return (
    <ol className={styles.robot_list}>
      {props.children}
    </ol>
  )
}
