// @flow
import * as React from 'react'

import {SidePanel} from '@opentrons/components'
import InstrumentList from './InstrumentList'
import DeckCalibrationGroup from './DeckCalibrationGroup'
import TipRackList from './TipRackList'
import LabwareList from './LabwareList'
import styles from './styles.css'

export default function SetupPanel () {
  return (
    <SidePanel title='Prepare for Run'>
      <div className={styles.setup_panel}>
        <InstrumentList />
        <DeckCalibrationGroup>
          <TipRackList />
          <LabwareList />
        </DeckCalibrationGroup>
      </div>
    </SidePanel>
  )
}
