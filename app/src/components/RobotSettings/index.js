// @flow
// robot status panel with connect button
import * as React from 'react'

import type {Robot} from '../../robot'

import StatusCard from './StatusCard'
// import AttachedInstrumentsCard from './AttachedInstrumentsCard'
import InformationCard from './InformationCard'
import ConnectivityCard from './ConnectivityCard'
import CalibrationCard from './CalibrationCard'
import ConnectAlertModal from './ConnectAlertModal'
import styles from './styles.css'

type Props = Robot

export default function RobotSettings (props: Props) {
  return (
    <div className={styles.robot_settings}>
      <div className={styles.row}>
        <StatusCard {...props} />
      </div>
      {/* <div className={styles.row}>
      <AttachedInstrumentsCard {...props} />
      </div> */}
      <div className={styles.row}>
        <InformationCard {...props} />
      </div>
      <div className={styles.row}>
        <div className={styles.column_50}>
          <ConnectivityCard {...props} />
        </div>
        <div className={styles.column_50}>
          <CalibrationCard {...props} />
        </div>
      </div>
    </div>
  )
}

export {ConnectAlertModal}
