import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'

import {TitledList} from '@opentrons/components'
import LabwareListItem from './LabwareListItem'

import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

export default withRouter(
  connect(mapStateToProps, null, mergeProps)(TipRackList)
)

function TipRackList (props) {
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

function mapStateToProps (state) {
  return {
    _tipracks: robotSelectors.getTipracks(state),
    disabled: robotSelectors.getTipracksConfirmed(state),
    _calibrator: robotSelectors.getCalibratorMount(state),
    _deckPopulated: robotSelectors.getDeckPopulated(state),
  }
}

function mergeProps (stateProps, dispatchProps) {
  const {_calibrator, _deckPopulated, disabled} = stateProps
  const {dispatch} = dispatchProps

  const tipracks = stateProps._tipracks.map(tr => {
    return {
      ...tr,
      setLabware: () => {
        const calibrator = tr.calibratorMount || _calibrator
        if (_deckPopulated && calibrator) {
          dispatch(robotActions.moveTo(calibrator, tr.slot))
        }
      },
    }
  })

  return {
    tipracks,
    disabled,
  }
}
