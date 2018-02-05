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
  _tipracks: Labware[],
  _calibrator: Mount,
  _deckPopulated: boolean,
  disabled: boolean
}

type DispatchProps = {
  dispatch: Dispatch<*>
}

type ListProps = {
  tipracks: Labware[],
  deckPopulated: boolean,
  setLabware?: () => void,
  disabled: boolean,
  children: React.Node[]
}

export default connect(mapStateToProps, null, mergeProps)(TipRackList)

function TipRackList (props: ListProps) {
  const {tipracks, disabled} = props
  return (
    <TitledList title='tipracks' disabled={disabled}>
      {tipracks.map(tr => (
        <LabwareListItem
          {...tr}
          key={tr.slot}
          isDisabled={tr.confirmed}
          confirmed={tr.confirmed}
          onClick={tr.setLabware}
        />
      ))}
    </TitledList>
  )
}

function mapStateToProps (state: StateProps) {
  return {
    _tipracks: robotSelectors.getTipracks(state),
    disabled: robotSelectors.getTipracksConfirmed(state),
    _calibrator: robotSelectors.getCalibratorMount(state),
    _deckPopulated: robotSelectors.getDeckPopulated(state)
  }
}

function mergeProps (stateProps: StateProps, dispatchProps: DispatchProps) {
  const {_calibrator, _deckPopulated, disabled} = stateProps
  const {dispatch} = dispatchProps

  const tipracks = stateProps._tipracks.map(tr => {
    return {
      ...tr,
      setLabware: () => {
        const calibrator = tr.calibratorMount || _calibrator
        if (_deckPopulated && calibrator) {
          dispatch(robotActions.pickupAndHome(calibrator, tr.slot))
        }
      }
    }
  })

  return {
    tipracks,
    disabled
  }
}
