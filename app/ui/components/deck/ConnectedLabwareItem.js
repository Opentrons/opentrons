// @flow
// import * as React from 'react'
import {connect} from 'react-redux'

import LabwareItem from './LabwareItem'

import {
  constants as robotConstants,
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

const {
  // UNCONFIRMED,
  MOVING_TO_SLOT,
  PICKING_UP,
  HOMING,
  UPDATING,
  CONFIRMING
  // CONFIRMED
} = robotConstants

export default connect(mapStateToProps, null, mergeProps)(LabwareItem)

function mapStateToProps (state, ownProps) {
  const {slotName} = ownProps
  const labware = robotSelectors.getLabwareBySlot(state)[slotName]

  if (labware === undefined) {
    // bail out, it's an empty slot
    return {}
  }

  const containerType = labware.type
  const containerName = labware.name

  const nextLabware = robotSelectors.getNextLabware(state)
  const labwareReviewed = robotSelectors.getLabwareReviewed(state)

  // TODO: Ian 2017-12-14 single-labware-oriented selector instead? slot in number, slotName is string like '1'
  const labwareToSlotName = labwareObj => labwareObj && labwareObj.slot && labwareObj.slot.toString()

  // TODO: Ian 2017-12-14 do selector HACK HACK HACK
  const routeSlot = state.router.location.pathname.split('/').slice(-1)[0]
  const highlighted = slotName === (routeSlot || labwareToSlotName(nextLabware))

  // NOTE: this is a hacky carryover from Protocol Designer.
  // TODO Ian 2017-12-14 allow alternative to wellContents for setting well styles.
  const wellContents = highlighted ? {'A1': {selected: true, groupId: 6}} : {}

  // TODO Ian 2017-12-14 this is ugly, sorry, probably should happen in selector soon
  const allLabwareCalibrationStuff = robotSelectors.getLabware(state)
  const thisLabwareCalibrationStuff = (
    allLabwareCalibrationStuff &&
    allLabwareCalibrationStuff[labware.slot - 1]
  ) || {}

  const {calibration, confirmed, isTiprack} = thisLabwareCalibrationStuff

  const isMoving = ( // TODO Ian 2017-12-14 another selector candidate
    calibration === MOVING_TO_SLOT ||
    calibration === PICKING_UP ||
    calibration === HOMING ||
    calibration === UPDATING ||
    calibration === CONFIRMING
  )

  return {
    containerType,
    containerName,
    wellContents,
    highlighted,
    labwareReviewed,
    canRevisit: labwareReviewed && !(isTiprack && confirmed), // user cannot revisit a confirmed tiprack
    isMoving,
    confirmed,

    // Data to pass to mergeProps but not to component
    _stateData: {
      axis: robotSelectors.getSingleChannel(state).axis,
      isTiprack
    }
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  console.log({stateProps, ownProps})
  const {dispatch} = dispatchProps

  const slot = (ownProps && ownProps.slotName) ? parseInt(ownProps.slotName) : undefined
  const _stateData = stateProps._stateData || {}
  const {axis, isTiprack} = _stateData

  const onLabwareClick = (e) => {
    if (isTiprack) {
      if (!stateProps.confirmed) {
        dispatch(robotActions.pickupAndHome(axis, slot))
      }
    } else {
      dispatch(robotActions.moveTo(axis, slot))
    }
  }

  const setLabwareConfirmed = (e) => dispatch(robotActions.confirmLabware(slot))

  return {
    onLabwareClick,
    setLabwareConfirmed,

    ...ownProps,
    ...stateProps,
    _stateData: undefined // don't pass to component
  }
}
