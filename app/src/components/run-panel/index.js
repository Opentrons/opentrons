import * as React from 'react'
import {connect} from 'react-redux'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../../robot'

import RunTimer from './RunTimer'
import RunControls from './RunControls'
import {SidePanelGroup} from '@opentrons/components'

const mapStateToProps = (state) => ({
  isRunning: robotSelectors.getIsRunning(state),
  isPaused: robotSelectors.getIsPaused(state),
  sessionName: robotSelectors.getSessionName(state),
  startTime: robotSelectors.getStartTime(state),
  isReadyToRun: robotSelectors.getIsReadyToRun(state),
  runTime: robotSelectors.getRunTime(state) || '00:00:00',
  runProgress: robotSelectors.getRunProgress(state),
  // TODO(mc, 2017-09-26): remove development hardcoded values for errors
  errors: []
})

const mapDispatchToProps = (dispatch) => ({
  onRunClick: () => dispatch(robotActions.run()),
  onPauseClick: () => dispatch(robotActions.pause()),
  onResumeClick: () => dispatch(robotActions.resume()),
  onCancelClick: () => dispatch(robotActions.cancel())
})

function RunPanel (props) {
  return (
    <div>
      <SidePanelGroup>
        <RunTimer startTime={props.startTime} runTime={props.runTime} />
        <RunControls {...props} />
      </SidePanelGroup>
    </div>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(RunPanel)
