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
  // UNCONFIRMED,
  MOVING_TO_SLOT,
  PICKING_UP,
  HOMING,
  UPDATING,
  CONFIRMING
  // CONFIRMED
} = robotConstants

// TODO: Ian 2017-12-14 single-labware-oriented selector instead? slot in number, slotName is string like '1'
const labwareToSlotName = (lw) => lw && lw.slot && `${lw.slot}`

export default withRouter(connect(mapStateToProps, null, mergeProps)(LabwareItem))

function mapStateToProps (state, ownProps) {
  const {slotName} = ownProps
  const routeSlot = ownProps.match.params.slot
  const labware = robotSelectors.getLabwareBySlot(state)[slotName]

  // bail out if it's an empty slot
  if (labware === undefined) return {}

  const containerType = labware.type
  const containerName = labware.name

  const nextLabware = robotSelectors.getNextLabware(state)
  const deckPopulated = robotSelectors.getDeckPopulated(state)
  const allTipracksConfirmed = robotSelectors.getTipracksConfirmed(state)

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

  const {confirmed, isTiprack} = thisLabwareCalibrationStuff

  // TODO Ian 2017-12-14 another selector candidate
  const isMoving = allLabwareCalibrationStuff.some(l =>
    l.calibration === MOVING_TO_SLOT ||
    l.calibration === PICKING_UP ||
    l.calibration === HOMING ||
    l.calibration === UPDATING ||
    l.calibration === CONFIRMING
  )

  return {
    containerType,
    containerName,
    wellContents,
    highlighted,
    deckPopulated,
    canRevisit: deckPopulated && !isMoving &&
      allTipracksConfirmed &&
      !(isTiprack && confirmed), // user cannot revisit a confirmed tiprack
    isMoving,
    confirmed,

    // Data to pass to mergeProps but not to component
    _stateData: {
      calibrator: robotSelectors.getCalibratorMount(state),
      isTiprack
    }
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const {dispatch} = dispatchProps

  const slot = ownProps && ownProps.slotName && parseInt(ownProps.slotName)
  const _stateData = stateProps._stateData || {}
  const {calibrator, isTiprack} = _stateData

  const onLabwareClick = (e) => {
    if (isTiprack) {
      if (!stateProps.confirmed) {
        dispatch(robotActions.pickupAndHome(calibrator, slot))
      }
    } else {
      dispatch(robotActions.moveTo(calibrator, slot))
    }
  }

  const setLabwareConfirmed = (e) => dispatch(robotActions.confirmLabware(slot))

  return {
    onLabwareClick,
    setLabwareConfirmed,
    ...ownProps,
    ...stateProps
  }
}
