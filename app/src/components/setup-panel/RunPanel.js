import React from 'react'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

import RunMessage from './RunMessage'
import RunLink from './RunLink'

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RunPanel)

function RunPanel (props) {
  const {isRunning, readyToRun, run} = props
  const runMessage = readyToRun && (<RunMessage />)
  const runLinkUrl = isRunning
    ? '#'
    : '/run'
  const onRunClick = readyToRun && !isRunning
    ? run
    : null

  const isDisabled = !readyToRun || isRunning

  return (
    <div>
      {runMessage}
      <RunLink to={runLinkUrl} onClick={onRunClick} disabled={isDisabled} />
    </div>
  )
}

function mapStateToProps (state) {
  return {
    isRunning: robotSelectors.getIsRunning(state),
    readyToRun: robotSelectors.getLabwareConfirmed(state)
  }
}

function mapDispatchToProps (dispatch) {
  return {
    run: () => dispatch(robotActions.run())
  }
}
