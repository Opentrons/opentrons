import React from 'react'
import InstrumentList from './InstrumentList'
import LabwareList from './LabwareList'
import RunPanel from './RunPanel'

export default function SetupPanel (props) {
  return (
    <div>
      <InstrumentList />
      <LabwareList />
      <RunPanel />
    </div>
  )
}
