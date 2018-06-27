// @flow
import * as React from 'react'

import {SidePanel} from '@opentrons/components'
import PipetteList from './PipetteList'
import LabwareCalibrationGroup from './LabwareCalibrationGroup'
import TipRackList from './TipRackList'
import LabwareList from './LabwareList'
import styles from './styles.css'

export default function CalibratePanel () {
  return (
    <SidePanel title='Prepare for Run'>
      <div className={styles.setup_panel}>
        <PipetteList />
        <LabwareCalibrationGroup>
          <TipRackList />
          <LabwareList />
        </LabwareCalibrationGroup>
      </div>
    </SidePanel>
  )
}
