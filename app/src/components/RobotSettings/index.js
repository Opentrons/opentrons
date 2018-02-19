// @flow
// robot status panel with connect button
import * as React from 'react'

import type {Robot} from '../../robot'

import StatusCard from './StatusCard'
import styles from './styles.css'

type Props = Robot

export default function RobotSettings (props: Props) {
  return (
    <div className={styles.robot_settings}>
      <StatusCard {...props} />
    </div>
  )
}
