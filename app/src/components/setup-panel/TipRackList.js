import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {TitledList} from '@opentrons/components'
import LabwareListItem from './LabwareListItem'

import {
  selectors as robotSelectors,
  actions as robotActions,
  type Labware,
  type Mount
} from '../../robot'

type StateProps = {
  tipracks: Labware[],
  _calibrator: Mount,
  deckPopulated: boolean,
  disabled: boolean
}

type DispatchProps = {
  dispatch: Dispatch<*>
}

type ListProps = {
  tipracks: Labware[],
  deckPopulated: boolean,
  setLabwareBySlot?: () => void,
  disabled: boolean,
  children: React.Node[]
}

export default connect(mapStateToProps, null, mergeProps)(TipRackList)

function TipRackList (props: ListProps) {
  const {tipracks, setLabwareBySlot, disabled, deckPopulated} = props
  const onClick = deckPopulated ? setLabwareBySlot : null
  return (
    <TitledList title='tipracks' disabled={disabled}>
      {tipracks.map(tr => (
        <LabwareListItem
          {...tr}
          key={tr.slot}
          isDisabled={tr.confirmed}
          confirmed={tr.confirmed}
          onClick={onClick}
        />
      ))}
    </TitledList>
  )
}

function mapStateToProps (state: StateProps) {
  return {
    tipracks: robotSelectors.getTipracks(state),
    disabled: robotSelectors.getTipracksConfirmed(state),
    _calibrator: robotSelectors.getCalibratorMount(state),
    _deckPopulated: robotSelectors.getDeckPopulated(state)
  }
}

function mergeProps (stateProps: StateProps, dispatchProps: DispatchProps) {
  const {tipracks, _calibrator, deckPopulated, disabled} = stateProps
  const {dispatch} = dispatchProps

  const setLabwareBySlot = tipracks.reduce((result, tr: Labware) => {
    const calibrator = tr.calibratorMount || _calibrator

    if (deckPopulated && calibrator) {
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
