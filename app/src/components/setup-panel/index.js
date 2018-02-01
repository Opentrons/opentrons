import React from 'react'
import InstrumentList from './InstrumentList'
import DeckCalibrationGroup from './DeckCalibrationGroup'
import TipRackList from './TipRackList'
import LabwareList from './LabwareList'
import RunPanel from './RunPanel'

export default function SetupPanel (props) {
  return (
    <div>
      <InstrumentList />
      <DeckCalibrationGroup>
        <TipRackList />
        <LabwareList />
      </DeckCalibrationGroup>
      <RunPanel />
    </div>
  )
}
