import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {TitledList} from '@opentrons/components'
import LabwareListItem from './LabwareListItem'

import {
  selectors as robotSelectors,
  actions as robotActions,
  type Mount,
  type Labware
} from '../../robot'

type StateProps = {
  _labware: Labware[],
  _calibrator: Mount | '',
  deckPopulated: boolean,
  disabled: boolean
}

type DispatchProps = {
  dispatch: Dispatch<*>
}

type ListProps = {
  labware: Labware[],
  deckPopulated: boolean,
  setLabwareBySlot?: () => void,
  disabled: boolean,
  children: React.Node[]
}

export default connect(
  mapStateToProps,
  null,
  mergeProps
)(LabwareList)

function LabwareList (props: ListProps) {
  const {labware, disabled} = props
  return (
    <TitledList title='labware' disabled={disabled}>
      {labware.map(lw => (
        <LabwareListItem
          {...lw}
          isDisabled={disabled}
          confirmed={lw.confirmed}
          key={lw.slot}
          onClick={lw.setLabware}
        />
      ))}
    </TitledList>
  )
}

function mapStateToProps (state) {
  const tipracksConfirmed = robotSelectors.getTipracksConfirmed(state)
  return {
    _labware: robotSelectors.getNotTipracks(state),
    disabled: !tipracksConfirmed,
    _calibrator: robotSelectors.getCalibratorMount(state),
    _deckPopulated: robotSelectors.getDeckPopulated(state)
  }
}

function mergeProps (stateProps: StateProps, dispatchProps: DispatchProps) {
  const {_calibrator, deckPopulated, disabled} = stateProps
  const {dispatch} = dispatchProps

  const labware = stateProps._labware.map(lw => {
    return {
      ...lw,
      setLabware: () => {
        const calibrator = lw.calibratorMount || _calibrator
        if (deckPopulated && calibrator) {
          dispatch(robotActions.moveTo(calibrator, lw.slot))
        }
      }
    }
  })

  return {
    labware,
    disabled
  }
}
