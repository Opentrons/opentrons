// @flow
// deck review modal for labware calibration page
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {
  actions as robotActions,
  selectors as robotSelectors,
  type Mount,
  type Labware
} from '../../robot'

import Modal from './Modal'
import Prompt from './Prompt'
import Deck from './Deck'

type Props = Labware & {
  onClick: () => void
}

type StateProps = {
  currentLabware: Labware,
  _calibrator: ?Mount
}

type DispatchProps = {
  dispatch: Dispatch<*>
}

type OwnProps = {
  slot: ?string
}

export default connect(mapStateToProps, null, mergeProps)(ReviewDeckModal)

function ReviewDeckModal (props: Props) {
  return (
    <Modal>
      {/* $FlowFixMe: `...props` type doesn't include necessary keys */}
      <Prompt {...props} />
      <Deck />
    </Modal>
  )
}

function mapStateToProps (state, ownProps: OwnProps): StateProps {
  // TODO(mc, 2018-02-05): getCurrentLabware selector
  const labware = robotSelectors.getLabware(state)
  const currentLabware = labware.find((lw) => lw.slot === ownProps.slot)

  if (!currentLabware) {
    throw new Error('no currentLabware; this is a bug')
  }

  return {
    currentLabware,
    _calibrator: (
      currentLabware.calibratorMount ||
      robotSelectors.getCalibratorMount(state)
    )
  }
}

function mergeProps (
  stateProps: StateProps,
  dispatchProps: DispatchProps
): Props {
  const {currentLabware, _calibrator} = stateProps
  const {dispatch} = dispatchProps

  return {
    ...currentLabware,
    onClick: () => {
      if (_calibrator) {
        dispatch(robotActions.moveTo(_calibrator, currentLabware.slot))
      }
    }
  }
}
