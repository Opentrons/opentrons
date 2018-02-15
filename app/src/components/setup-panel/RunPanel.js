// @flow
// Run panel container
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

import RunMessage from './RunMessage'
import RunButton from './RunButton'

type StateProps = {
  isRunning: boolean,
  labwareConfirmed: boolean,
  readyToRun: boolean
}

type DispatchProps = {
  run: () => void
}

type RunPanelProps = StateProps & DispatchProps

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RunPanel)

function RunPanel (props: RunPanelProps) {
  const {isRunning, labwareConfirmed, readyToRun, run} = props
  const runMessage = labwareConfirmed && (<RunMessage />)
  const isDisabled = !readyToRun || isRunning

  return (
    <div>
      {readyToRun && runMessage}
      <RunButton onClick={run} disabled={isDisabled} />
    </div>
  )
}

function mapStateToProps (state): StateProps {
  return {
    isRunning: robotSelectors.getIsRunning(state),
    labwareConfirmed: robotSelectors.getLabwareConfirmed(state),
    readyToRun: robotSelectors.getInstrumentsCalibrated(state)
  }
}

function mapDispatchToProps (
  dispatch: Dispatch<*>,
  stateProps: StateProps
): DispatchProps {
  return {
    run: () => {
      dispatch(push('/run'))
      dispatch(robotActions.run())
    }
  }
}
