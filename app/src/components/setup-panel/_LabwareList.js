import React from 'react'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

import {TitledList} from '@opentrons/components'
import LabwareListItem from './LabwareListItem'

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
    // TODO(mc, 2018-01-19): remove all these extra props (see LabwareListItem)
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

  return (
    <TitledList title={title}>
      {tiprackList}
      {labwareList}
    </TitledList>
  )
}
function mapStateToProps (state, ownProps) {
  return {
    labware: robotSelectors.getLabware(state),
    labwareBySlot: robotSelectors.getLabwareBySlot(state),
    deckPopulated: robotSelectors.getDeckPopulated(state),
    instrumentsCalibrated: robotSelectors.getInstrumentsCalibrated(state),
    tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
    labwareConfirmed: robotSelectors.getLabwareConfirmed(state),
    isRunning: robotSelectors.getIsRunning(state),
    _calibrator: robotSelectors.getCalibratorMount(state)
  }
}

function mergeProps (stateProps, dispatchProps) {
  const {
    _calibrator,
    deckPopulated,
    instrumentsCalibrated,
    tipracksConfirmed,
    isRunning
  } = stateProps
  const {dispatch} = dispatchProps
  const labware = stateProps.labware.map(lw => {
    const isDisabled = (
      !instrumentsCalibrated ||
      (lw.isTiprack && lw.confirmed) ||
      !(lw.isTiprack || tipracksConfirmed) ||
      isRunning
    )

    const calibrator = lw.calibratorMount || _calibrator

    return {
      ...lw,
      isDisabled,
      setLabware: () => {
        if (deckPopulated) {
          if (lw.isTiprack) {
            return dispatch(robotActions.pickupAndHome(calibrator, lw.slot))
          }
          dispatch(robotActions.moveTo(_calibrator, lw.slot))
        }
      }
    }
  })

  return {
    ...stateProps,
    labware
  }
}
