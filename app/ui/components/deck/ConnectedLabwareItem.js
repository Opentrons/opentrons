// @flow
// import * as React from 'react'
import {connect} from 'react-redux'

import LabwareItem from './LabwareItem'

import {
  selectors as robotSelectors
  // actions as robotActions
} from '../../robot'

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

  console.log({labware, ownProps})

  if (labware === undefined) {
    // bail out, it's an empty slot
    return {}
  }

  const containerType = labware.type
  const containerName = labware.name

  const nextLabware = robotSelectors.getNextLabware(state)
  const unconfirmedLabware = robotSelectors.getUnconfirmedLabware(state)

  // TODO: maybe in the selector instead? slot in number, slotName is string like '1'
  const labwareToSlotName = labwareObj => labwareObj && labwareObj.slot && labwareObj.slot.toString()

  const highlighted = labwareToSlotName(nextLabware) === slotName

  const wellContents = highlighted ? {'A1': {selected: true}} : {} // NOTE: this is a carryover from Protocol Designer
  return {
    containerType,
    containerName,
    wellContents,
    highlighted,
    unconfirmed: unconfirmedLabware.some(l => labwareToSlotName(l) === slotName)
  }
}

const ConnectedLabwareItem = connect(mapStateToProps)(LabwareItem)

export default ConnectedLabwareItem
