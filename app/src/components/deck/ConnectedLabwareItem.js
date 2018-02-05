// import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'

import LabwareItem from './LabwareItem'

import {
  constants as robotConstants,
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

const {
  MOVING_TO_SLOT,
  PICKING_UP,
  HOMING,
  UPDATING,
  CONFIRMING
} = robotConstants

export default withRouter(connect(mapStateToProps, null, mergeProps)(LabwareItem))

function mapStateToProps (state, ownProps) {
  const {slotName} = ownProps
  const {match: {params: {slot: selectedSlot}}} = ownProps
  const allLabware = robotSelectors.getLabware(state)

  const selectedLabware = allLabware.find((lw) => lw.slot === selectedSlot)
  const labware = allLabware.find((lw) => lw.slot === slotName)

  // bail out if it's an empty slot
  if (labware == null) return {}

  const nextLabware = robotSelectors.getNextLabware(state)
  const allTipracksConfirmed = robotSelectors.getTipracksConfirmed(state)
  const {
    type,
    name,
    confirmed,
    calibration,
    isTiprack,
    calibratorMount
  } = labware

  const current = slotName === selectedSlot
  const highlighted = (
    (current && !confirmed) ||
    (selectedLabware.confirmed && nextLabware && slotName === nextLabware.slot)
  )

  // NOTE: this is a hacky carryover from Protocol Designer.
  // TODO Ian 2017-12-14 allow alternative to wellContents for setting well styles.
  const wellContents = highlighted ? {'A1': {selected: true, groupId: 6}} : {}

  // TODO Ian 2017-12-14 another selector candidate
  const isMoving = highlighted && (
    calibration === MOVING_TO_SLOT ||
    calibration === PICKING_UP ||
    calibration === HOMING ||
    calibration === UPDATING ||
    calibration === CONFIRMING
  )

  return {
    containerType: type,
    containerName: name,
    wellContents,
    highlighted,
    canRevisit: !isMoving &&
      allTipracksConfirmed &&
      !(isTiprack && confirmed), // user cannot revisit a confirmed tiprack
    isMoving,
    confirmed,

    // pass to mergeProps but not to component
    _calibrator: calibratorMount || robotSelectors.getCalibratorMount(state),
    _isTiprack: isTiprack
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const {confirmed, _calibrator, _isTiprack} = stateProps
  const {dispatch} = dispatchProps
  const slot = ownProps && ownProps.slotName

  const onLabwareClick = () => {
    if (_isTiprack) {
      if (!confirmed) {
        dispatch(robotActions.pickupAndHome(_calibrator, slot))
      }
    } else {
      dispatch(robotActions.moveTo(_calibrator, slot))
    }
  }

  const setLabwareConfirmed = () => dispatch(robotActions.confirmLabware(slot))

  return {
    onLabwareClick,
    setLabwareConfirmed,
    ...ownProps,
    ...stateProps
  }
}
