// @flow
// import * as React from 'react'
import {connect} from 'react-redux'

import LabwareItem from './LabwareItem'

import {
  constants as robotConstants,
  selectors as robotSelectors
  // actions as robotActions
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

// TODO: actions
// const mergeProps = (stateProps, dispatchProps, ownProps) => {
//   const {singleChannel: {axis}} = stateProps
//   const {dispatch} = dispatchProps
//   const {slot} = ownProps || {}
//   const labware = stateProps.labware.map(lw => ({
//     ...lw,
//     isCurrent: (lw.slot === slot),
//     // TODO(mc, 2017-11-29): DRY (logic shared by NextLabware, ReviewLabware,
//     // Deck, and ConnectedSetupPanel); could also move logic to the API client
//     moveToLabware: () => {
//       if (lw.isTiprack) {
//         return dispatch(robotActions.pickupAndHome(axis, lw.slot))
//       }
//       dispatch(robotActions.moveTo(axis, lw.slot))
//     },
//     setLabwareConfirmed: () => dispatch(robotActions.confirmLabware(lw.slot))
//   }))
//
//   return {
//     ...stateProps,
//     ...ownProps,
//     labware
//   }
// }

const mapStateToProps = (state, ownProps) => {
  const {slotName} = ownProps
  const labware = robotSelectors.getLabwareBySlot(state)[slotName]

  if (labware === undefined) {
    // bail out, it's an empty slot
    return {}
  }

  const containerType = labware.type
  const containerName = labware.name

  const nextLabware = robotSelectors.getNextLabware(state)
  const unconfirmedLabware = robotSelectors.getUnconfirmedLabware(state)
  const labwareReviewed = robotSelectors.getLabwareReviewed(state)

  // TODO: Ian 2017-12-14 single-labware-oriented selector instead? slot in number, slotName is string like '1'
  const labwareToSlotName = labwareObj => labwareObj && labwareObj.slot && labwareObj.slot.toString()

  const highlighted = labwareToSlotName(nextLabware) === slotName

  // NOTE: this is a hacky carryover from Protocol Designer.
  // TODO Ian 2017-12-14 allow alternative to wellContents for setting well styles.
  const wellContents = highlighted ? {'A1': {selected: true, groupId: 6}} : {}

  // TODO Ian 2017-12-14 this is ugly, needs selector
  const allLabwareCalibrationStuff = robotSelectors.getLabware(state)
  const calibration = allLabwareCalibrationStuff && allLabwareCalibrationStuff[labware.slot - 1] && allLabwareCalibrationStuff[labware.slot - 1].calibration

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
    isMoving,
    confirmed: unconfirmedLabware.every(l => labwareToSlotName(l) !== slotName)
  }
}

const ConnectedLabwareItem = connect(mapStateToProps)(LabwareItem)

export default ConnectedLabwareItem
