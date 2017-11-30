import React from 'react'
import {connect} from 'react-redux'
import {
  actions as robotActions,
  selectors as robotSelectors
} from '../../../robot'

import TitledList from './TitledList'
import LabwareListItem from './LabwareListItem'
import ListAlert from './ListAlert'

export default connect(mapStateToProps, null, mergeProps)(LabwareList)

function LabwareList (props) {
  const title = 'Labware Setup'
  const {
    isRunning,
    labware,
    instrumentsCalibrated,
    tipracksConfirmed
  } = props

  const {tiprackList, labwareList} = labware.reduce((result, lab) => {
    const {slot, name, isTiprack, moveToLabware} = lab

    const links = (
      <LabwareListItem
        {...lab}
        key={slot}
        instrumentsCalibrated={instrumentsCalibrated}
        tipracksConfirmed={tipracksConfirmed}
        onClick={!isRunning && moveToLabware}
      />
    )

    if (name && isTiprack) {
      result.tiprackList.push(links)
    } else if (name) {
      result.labwareList.push(links)
    }

    return result
  }, {tiprackList: [], labwareList: []})

  const labwareMsg = !instrumentsCalibrated
    ? <ListAlert>Setup is disabled until pipette setup is complete.</ListAlert>
    : null
  const pipetteMsg = !tipracksConfirmed && instrumentsCalibrated
    ? <ListAlert>Tipracks must be setup first.</ListAlert>
    : null

  return (
    <TitledList title={title}>
      {tiprackList}
      {labwareList}
      {labwareMsg}
      {pipetteMsg}
    </TitledList>
  )
}

function mapStateToProps (state) {
  return {
    labware: robotSelectors.getLabware(state),
    labwareReviewed: robotSelectors.getLabwareReviewed(state),
    instrumentsCalibrated: robotSelectors.getInstrumentsCalibrated(state),
    tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
    labwareConfirmed: robotSelectors.getLabwareConfirmed(state),
    singleChannel: robotSelectors.getSingleChannel(state),
    isRunning: robotSelectors.getIsRunning(state)
  }
}

function mergeProps (stateProps, dispatchProps) {
  const {singleChannel: {axis}} = stateProps
  const {dispatch} = dispatchProps
  const labware = stateProps.labware.map(lw => ({
    ...lw,
    moveToLabware: () => dispatch(robotActions.moveTo(axis, lw.slot))
  }))
  return {
    ...stateProps,
    labware
  }
}
