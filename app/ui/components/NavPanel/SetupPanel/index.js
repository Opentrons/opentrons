import React from 'react'
import InstrumentList from './InstrumentList'
import LabwareList from './LabwareList'

export default function SetupPanel (props) {
  return (
    <div>
      <InstrumentList />
      <LabwareList />
    </div>
  )
}
