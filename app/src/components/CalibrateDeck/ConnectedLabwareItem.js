// @flow
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {withRouter, type ContextRouter} from 'react-router'

import {
  selectors as robotSelectors,
  actions as robotActions,
  type Mount
} from '../../robot'

import type {LabwareComponentProps} from '@opentrons/components'
import LabwareItem, {type LabwareItemProps} from './LabwareItem'

type OwnProps = LabwareComponentProps & ContextRouter

type StateProps = {
  _calibrator?: ?Mount,
  _labware?: $PropertyType<LabwareItemProps, 'labware'>
}

type DispatchProps = {
  dispatch: Dispatch<*>
}

export default withRouter(
  connect(mapStateToProps, null, mergeProps)(LabwareItem)
)

function mapStateToProps (state, ownProps: OwnProps): StateProps {
  const {slot, match: {params: {slot: selectedSlot}}} = ownProps
  const allLabware = robotSelectors.getLabware(state)
  const tipracksConfirmed = robotSelectors.getTipracksConfirmed(state)
  const labware = allLabware.find((lw) => lw.slot === slot)

  // bail out if it's an empty slot
  if (!labware) return {}

  const {isTiprack, confirmed, calibratorMount} = labware
  const highlighted = slot === selectedSlot

  return {
    _calibrator: calibratorMount || robotSelectors.getCalibratorMount(state),
    _labware: {
      ...labware,
      highlighted,
      disabled: (isTiprack && confirmed) || (!isTiprack && !tipracksConfirmed),
      showName: highlighted || confirmed,
      showUnconfirmed: true,
      showSpinner: highlighted && labware.calibration === 'moving-to-slot',
      url: `/calibrate/labware/${slot}`
    }
  }
}

function mergeProps (
  stateProps: StateProps,
  dispatchProps: DispatchProps,
  ownProps: OwnProps
): LabwareItemProps {
  const {_labware, _calibrator} = stateProps
  const {dispatch} = dispatchProps

  if (!_labware) return {...ownProps}

  return {
    ...ownProps,
    labware: {
      ..._labware,
      onClick: () => {
        if (_calibrator && (!_labware.isTiprack || !_labware.confirmed)) {
          dispatch(robotActions.moveTo(_calibrator, _labware.slot))
        }
      }
    }
  }
}
