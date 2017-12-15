import React from 'react'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'
import TitledList from './TitledList'
import LabwareListItem from './LabwareListItem'
import ListAlert from './ListAlert'

export default connect(
  mapStateToProps,
  null,
  mergeProps
)(LabwareList)

function LabwareList (props) {
  const title = 'Labware Setup'
  const {
    isRunning,
    labware,
    instrumentsCalibrated,
    tipracksConfirmed
  } = props

  const {tiprackList, labwareList} = labware.reduce((result, lab) => {
    const {slot, name, isTiprack, setLabware} = lab

    const links = (
      <LabwareListItem
        {...lab}
        key={slot}
        instrumentsCalibrated={instrumentsCalibrated}
        tipracksConfirmed={tipracksConfirmed}
        onClick={!isRunning && setLabware}
        isRunning={isRunning}
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
    currentLabware: robotSelectors.getCurrentLabware(state),
    labware: robotSelectors.getLabware(state),
    labwareBySlot: robotSelectors.getLabwareBySlot(state),
    labwareReviewed: robotSelectors.getLabwareReviewed(state),
    instrumentsCalibrated: robotSelectors.getInstrumentsCalibrated(state),
    tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
    labwareConfirmed: robotSelectors.getLabwareConfirmed(state),
    singleChannel: robotSelectors.getSingleChannel(state),
    isRunning: robotSelectors.getIsRunning(state)
  }
}

function mergeProps (stateProps, dispatchProps) {
  const {
    currentLabware,
    singleChannel: {axis},
    labwareReviewed,
    instrumentsCalibrated,
    tipracksConfirmed,
    isRunning
  } = stateProps
  const {dispatch} = dispatchProps
  const labware = stateProps.labware.map(lw => {
    const isDisabled = !instrumentsCalibrated ||
    (lw.isTiprack && lw.confirmed) ||
    !(lw.isTiprack || tipracksConfirmed) ||
    isRunning
    const isActive = lw.slot === currentLabware

    return {
      ...lw,
      isDisabled,
      isActive,
      setLabware: () => {
        if (labwareReviewed) {
          if (lw.isTiprack) {
            return dispatch(robotActions.pickupAndHome(axis, lw.slot))
          }
          dispatch(robotActions.moveTo(axis, lw.slot))
        }
      }
    }
  })
  return {
    ...stateProps,
    labware
  }
}
