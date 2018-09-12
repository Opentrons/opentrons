// @flow
// upload progress container
import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter, Route, Switch, Redirect, type Match} from 'react-router'
import type {State} from '../../types'
import type {Robot} from '../../robot'
import {selectors as robotSelectors} from '../../robot'
import {Splash, SpinnerModal} from '@opentrons/components'
import Page from '../../components/Page'
import UploadStatus from './UploadStatus'
import FileInfo from './FileInfo'

type SP = {
  robot: ?Robot,
  name: string,
  uploadInProgress: boolean,
  uploadError: ?{message: string},
  protocolRunning: boolean,
  protocolDone: boolean,
}

type OP = {match: Match}

type Props = SP & OP

export default withRouter(
  connect(mapStateToProps)(UploadPage)
)

function mapStateToProps (state: State, ownProps: OP): SP {
  const connectedRobot = robotSelectors.getConnectedRobot(state)
  return {
    robot: connectedRobot,
    name: robotSelectors.getSessionName(state),
    uploadInProgress: robotSelectors.getSessionLoadInProgress(state),
    uploadError: robotSelectors.getUploadError(state),
    protocolRunning: robotSelectors.getIsRunning(state),
    protocolDone: robotSelectors.getIsDone(state),
  }
}

function UploadPage (props: Props) {
  const {robot, name, uploadInProgress, uploadError, match: {path}} = props
  if (!robot) return (<Redirect to='/robots' />)
  if (!name && !uploadInProgress && !uploadError) return (<Page><Splash /></Page>)
  if (uploadInProgress) return (<Page><SpinnerModal message='Upload in Progress'/></Page>)
  return (
    <Switch>
      <Route
        path={`${path}/file-info`}
        render={props => (<FileInfo name={name} robot={robot} />)}
      />
      <Route
        path={path}
        render={() => (<UploadStatus {...props}/>)}
      />
    </Switch>
  )
}
