// @flow
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
  labware: Labware[],
  _calibrator: Mount | '',
  _deckPopulated: boolean,
  setLabwareBySlot?: () => void,
  disabled: boolean
}

type DispatchProps = {
  dispatch: Dispatch<*>
}

type MergeProps = {
  setLabwareBySlot: () => void
}

type OwnProps = {
  chidren?: React.Node[]
}

type ListProps = StateProps & DispatchProps & MergeProps & OwnProps

export default connect(mapStateToProps, null, mergeProps)(LabwareList)

function LabwareList (props: ListProps) {
  const {labware, setLabwareBySlot, disabled, _deckPopulated} = props
  return (
    <TitledList title='labware' disabled={disabled}>
      {labware.map(lw => (
        <LabwareListItem
          {...lw}
          key={lw.slot}
          onClick={_deckPopulated && setLabwareBySlot}
        />
      ))}
    </TitledList>
  )
}

function mapStateToProps (state) {
  const tipracksConfirmed = robotSelectors.getTipracksConfirmed(state)
  return {
    labware: robotSelectors.getNotTipracks(state),
    disabled: !tipracksConfirmed,
    _calibrator: robotSelectors.getCalibratorMount(state),
    _deckPopulated: robotSelectors.getDeckPopulated(state)
  }
}

function mergeProps (stateProps: StateProps, dispatchProps: DispatchProps) {
  const {labware, _calibrator, _deckPopulated, disabled} = stateProps
  const {dispatch} = dispatchProps

  const setLabwareBySlot = labware.reduce((result, lw: Labware) => {
    const calibrator = lw.calibratorMount || _calibrator

    if (_deckPopulated && calibrator) {
      result[lw.slot] = () => dispatch(robotActions.moveTo(calibrator, lw.slot))
    }

    return result
  }, {})

  return {
    labware,
    setLabwareBySlot,
    disabled
  }
}
