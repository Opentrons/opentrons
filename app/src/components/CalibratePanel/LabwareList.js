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
  connect(mapStateToProps, null, mergeProps)(LabwareList)
)

function LabwareList (props) {
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
    _deckPopulated: robotSelectors.getDeckPopulated(state),
  }
}

function mergeProps (stateProps, dispatchProps) {
  const {_calibrator, _deckPopulated, disabled} = stateProps
  const {dispatch} = dispatchProps

  const labware = stateProps._labware.map(lw => {
    return {
      ...lw,
      setLabware: () => {
        const calibrator = lw.calibratorMount || _calibrator
        if (_deckPopulated && calibrator) {
          dispatch(robotActions.moveTo(calibrator, lw.slot))
        }
      },
    }
  })

  return {
    labware,
    disabled,
  }
}
