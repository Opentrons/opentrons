// @flow
// robot status panel with connect button
import * as React from 'react'
import {Route} from 'react-router'
import type {Robot} from '../../robot'

import StatusCard from './StatusCard'
import AttachedInstrumentsCard from './AttachedInstrumentsCard'
import InformationCard from './InformationCard'
import ControlsCard from './ControlsCard'
import ConnectivityCard from './ConnectivityCard'
import CalibrationCard from './CalibrationCard'
import ConnectAlertModal from './ConnectAlertModal'
import UpdateModal from './UpdateModal'
import styles from './styles.css'

type Props = Robot

export default function RobotSettings (props: Props) {
  const updateUrl = `/robots/${props.name}/update`

  return (
    <div className={styles.robot_settings}>
      <div className={styles.row}>
        <StatusCard {...props} />
      </div>
      <div className={styles.row}>
        <AttachedInstrumentsCard {...props} />
      </div>
      <div className={styles.row}>
        <InformationCard {...props} updateUrl={updateUrl} />
      </div>
      <div className={styles.row}>
        <ControlsCard {...props} />
      </div>
      <div className={styles.row}>
        <div className={styles.column_50}>
          <ConnectivityCard {...props} />
        </div>
        <div className={styles.column_50}>
          <CalibrationCard {...props} />
        </div>
      </div>
      <Route path={updateUrl} render={() => (
        <UpdateModal {...props} />
      )} />
    </div>
  )
}

export {ConnectAlertModal}
