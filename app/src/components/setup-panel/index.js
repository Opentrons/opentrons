// @flow
import * as React from 'react'

import InstrumentList from './InstrumentList'
import DeckCalibrationGroup from './DeckCalibrationGroup'
import TipRackList from './TipRackList'
import LabwareList from './LabwareList'
// import RunPanel from './RunPanel'
import styles from './styles.css'

export default function SetupPanel () {
  return (
    <div className={styles.setup_panel}>
      <InstrumentList />
      <DeckCalibrationGroup>
        <TipRackList />
        <LabwareList />
      </DeckCalibrationGroup>
    </div>
  )
}
