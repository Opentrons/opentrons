// @flow
// deck review modal for labware calibration page
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import {
  actions as robotActions,
  selectors as robotSelectors,
  type Mount,
  type Labware,
} from '../../robot'

import {Modal} from '../modals'
import Prompt from './Prompt'
import ReviewDeck from './ReviewDeck'

type OP = {slot: ?string}

type SP = {
  currentLabware: ?Labware,
  _calibratorMount: ?Mount,
}

type DP = {dispatch: Dispatch}

type Props = SP & {onClick: () => void}

export default connect(mapStateToProps, null, mergeProps)(ReviewDeckModal)

function ReviewDeckModal (props: Props) {
  const {currentLabware, onClick} = props

  return (
    <Modal>
      {currentLabware && (
        <Prompt {...currentLabware} onClick={onClick} />
      )}
      <ReviewDeck />
    </Modal>
  )
}

function mapStateToProps (state: State, ownProps: OP): SP {
  // TODO(mc, 2018-02-05): getCurrentLabware selector
  const labware = robotSelectors.getLabware(state)
  const currentLabware = labware.find((lw) => lw.slot === ownProps.slot)

  return {
    currentLabware,
    _calibratorMount: currentLabware && (
      currentLabware.calibratorMount ||
      robotSelectors.getCalibratorMount(state)
    ),
  }
}

function mergeProps (
  stateProps: SP,
  dispatchProps: DP
): Props {
  const {currentLabware, _calibratorMount} = stateProps
  const {dispatch} = dispatchProps

  return {
    ...stateProps,
    onClick: () => {
      if (currentLabware && _calibratorMount) {
        dispatch(robotActions.moveTo(_calibratorMount, currentLabware.slot))
      }
    },
  }
}
