// confirm labware prompt container
import {connect} from 'react-redux'
import React from 'react'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

import CalibrationLink from './CalibrationLink'

const mapStateToProps = (state) => {
  return {
    singleChannel: robotSelectors.getSingleChannel(state),
    nextLabware: robotSelectors.getNextLabware(state)
  }
}

const mergeProps = (stateProps, dispatchProps) => {
  const {nextLabware} = stateProps
  if (!nextLabware) return {}

  const {singleChannel: {axis}, nextLabware: {slot, isTiprack}} = stateProps
  const {dispatch} = dispatchProps
  return {
    ...stateProps,
    to: `/setup-deck/${slot}`,
    // TODO(mc, 2017-11-29): DRY (logic shared by NextLabware, ReviewLabware,
    // Deck, and ConnectedSetupPanel); could also move logic to the API client
    onClick: () => {
      if (isTiprack) return dispatch(robotActions.pickupAndHome(axis, slot))
      dispatch(robotActions.moveTo(axis, slot))
    }
  }
}

export default connect(
  mapStateToProps,
  null,
  mergeProps
)(NextLabwareLink)

function NextLabwareLink (props) {
  const {nextLabware} = props
  if (!nextLabware) return null
  return (
    <CalibrationLink {...props}>
      Move to next labware {nextLabware.type} in slot {nextLabware.slot}
    </CalibrationLink>
  )
}
