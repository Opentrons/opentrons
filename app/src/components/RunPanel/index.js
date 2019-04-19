// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../robot'

import { SidePanel, SidePanelGroup } from '@opentrons/components'
import RunTimer from './RunTimer'
import RunControls from './RunControls'
import TempDeckStatusCard from '../TempDeckStatusCard'

import type { State, Dispatch } from '../../types'

type SP = {|
  isRunning: boolean,
  isPaused: boolean,
  startTime: number,
  isReadyToRun: boolean,
  runTime: string,
  disabled: boolean,
|}

type DP = {|
  onRunClick: () => mixed,
  onPauseClick: () => mixed,
  onResumeClick: () => mixed,
  onResetClick: () => mixed,
|}

type Props = { ...SP, ...DP }

const mapStateToProps = (state: State): SP => ({
  isRunning: robotSelectors.getIsRunning(state),
  isPaused: robotSelectors.getIsPaused(state),
  startTime: robotSelectors.getStartTime(state),
  isReadyToRun: robotSelectors.getIsReadyToRun(state),
  runTime: robotSelectors.getRunTime(state),
  disabled:
    !robotSelectors.getSessionIsLoaded(state) ||
    robotSelectors.getCancelInProgress(state) ||
    robotSelectors.getSessionLoadInProgress(state),
})

const mapDispatchToProps = (dispatch: Dispatch): DP => ({
  // $FlowFixMe: robotActions.run is not typed
  onRunClick: () => dispatch(robotActions.run()),
  // $FlowFixMe: robotActions.pause is not typed
  onPauseClick: () => dispatch(robotActions.pause()),
  // $FlowFixMe: robotActions.resume is not typed
  onResumeClick: () => dispatch(robotActions.resume()),
  onResetClick: () => dispatch(robotActions.refreshSession()),
})

function RunPanel(props: Props) {
  return (
    <SidePanel title="Execute Run">
      <SidePanelGroup>
        <RunTimer startTime={props.startTime} runTime={props.runTime} />
        <RunControls {...props} />
      </SidePanelGroup>
      <TempDeckStatusCard />
    </SidePanel>
  )
}

export default connect<Props, {||}, _, _, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(RunPanel)
