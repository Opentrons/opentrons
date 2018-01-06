import React from 'react'
import {Route} from 'react-router'
import InstrumentList from './InstrumentList'
import LabwareList from './LabwareList'
import RunPanel from './RunPanel'

export default function SetupPanel (props) {
  return (
    <div>
      <Route path='/setup-instruments/:side' children={renderInstrumentList} />
      <Route path='/setup-labware/:slots' children={renderLabwareList} />
      <RunPanel />
    </div>
  )
}

function renderInstrumentList (props) {
  const {match} = props
  const {params} = match || {}

  return (
    <InstrumentList {...params} />
  )
}

function renderLabwareList (props) {
  const {match} = props
  const {params} = match || {}

  return (
    <LabwareList {...params} />
  )
}
