// confirm labware prompt container
import {connect} from 'react-redux'
import React from 'react'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

import CalibrationLink from './CalibrationLink'

const mapStateToProps = (state, ownProps) => {
  const nextLabware = robotSelectors.getNextLabware(state)

  return {
    _calibrator: nextLabware && nextLabware.calibratorMount
      ? nextLabware.calibratorMount
      : robotSelectors.getCalibratorMount(state),
    nextLabware: robotSelectors.getNextLabware(state)
  }
}

const mergeProps = (stateProps, dispatchProps) => {
  const {nextLabware} = stateProps
  if (!nextLabware) return {}

  const {_calibrator, nextLabware: {slot, isTiprack}} = stateProps
  const {dispatch} = dispatchProps

  return {
    ...stateProps,
    to: `/setup-deck/${slot}`,
    // TODO(mc, 2017-11-29): DRY (logic shared by NextLabware, ReviewLabware,
    // Deck, and ConnectedSetupPanel); could also move logic to the API client
    onClick: () => {
      if (isTiprack) {
        return dispatch(robotActions.pickupAndHome(_calibrator, slot))
      }

      dispatch(robotActions.moveTo(_calibrator, slot))
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
