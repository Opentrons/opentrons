import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {TitledList} from '@opentrons/components'
import LabwareListItem from './LabwareListItem'

import {
  selectors as robotSelectors,
  actions as robotActions,
  type Labware
} from '../../robot'

type StateProps = {
  tipracks: Labware[],
  _calibrator: string,
  _deckPopulated: boolean,
  disabled: boolean
}

type DispatchProps = {
  dispatch: Dispatch<*>
}

type MergeProps = {
  setLabwareBySlot: () => void
}

type ListProps = StateProps & DispatchProps & MergeProps

export default connect(mapStateToProps, null, mergeProps)(TipRackList)

function TipRackList (props: ListProps) {
  const {tipracks, setLabwareBySlot, disabled, _deckPopulated} = props
  return (
    <TitledList title='tipracks' disabled={disabled}>
      {tipracks.map(tr => (
        <LabwareListItem
          {...tr}
          key={tr.slot}
          onClick={_deckPopulated && setLabwareBySlot}
        />
      ))}
    </TitledList>
  )
}

function mapStateToProps (state) {
  return {
    tipracks: robotSelectors.getTipracks(state),
    disabled: robotSelectors.getTipracksConfirmed(state),
    _calibrator: robotSelectors.getCalibratorMount(state),
    _deckPopulated: robotSelectors.getDeckPopulated(state)
  }
}

function mergeProps (stateProps: StateProps, dispatchProps: DispatchProps) {
  const {tipracks, _calibrator, _deckPopulated, disabled} = stateProps
  const {dispatch} = dispatchProps

  const setLabwareBySlot = tipracks.reduce((result, tr: Labware) => {
    const calibrator = tr.calibratorMount || _calibrator

    if (_deckPopulated && calibrator) {
      result[tr.slot] = () => dispatch(robotActions.pickupAndHome(calibrator, tr.slot))
    }

    return result
  }, {})

  return {
    tipracks,
    setLabwareBySlot,
    disabled
  }
}
