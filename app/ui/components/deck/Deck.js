// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import {DeckFactory, LabwareContainer, Plate, EmptyDeckSlot, types} from '@opentrons/components'
import styles from './deck.css'

import {
  selectors as robotSelectors
//   actions as robotActions
} from '../../robot'

function LabwarePlate (props: types.DeckSlotProps) {
  const {height, width, slotName, containerType, wellContents} = props
  return <LabwareContainer slotName={slotName}>
    {containerType
      ? <Plate {...{containerType, wellContents}} />
      : <EmptyDeckSlot {...{height, width, slotName}} />
    }
  </LabwareContainer>
}

// TODO factor out
const mapStateToProps = (state, ownProps) => {
  const {slotName} = ownProps
  const labware = robotSelectors.getLabware(state)
  const containerType = slotName in labware && labware[slotName].type
  const wellContents = {'A1': {selected: true}} // TODO: what will this look like for App?
  return {containerType, wellContents}
}

const ConnectedLabware = connect(mapStateToProps)(LabwarePlate)
// -------------

const DeckComponent = DeckFactory(ConnectedLabware)

export default function Deck (props) {
  // const {labware, tipracksConfirmed, labwareReviewed} = props
  return <div style={{width: '100%'}} >
    <DeckComponent className={styles.deck} />
  </div>
}

// // deck map container
// import {connect} from 'react-redux'
//
// import {
//   selectors as robotSelectors,
//   actions as robotActions
// } from '../../robot'
//
// import DeckMap from './DeckMap'
//
// const mapStateToProps = (state) => {
//   const labware = robotSelectors.getLabware(state)
//   return {
//     labware,
//     labwareReviewed: robotSelectors.getLabwareReviewed(state),
//     tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
//     singleChannel: robotSelectors.getSingleChannel(state)
//   }
// }
//
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
// export default connect(mapStateToProps, null, mergeProps)(DeckMap)
