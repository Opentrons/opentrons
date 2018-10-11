// @flow
// upload progress container
import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter, Route, Switch, Redirect} from 'react-router'

import {selectors as robotSelectors} from '../../robot'
import {getProtocolFilename} from '../../protocol'
import {getConnectedRobot} from '../../discovery'

import {Splash} from '@opentrons/components'
import Page from '../../components/Page'
import FileInfo from './FileInfo'

import type {ContextRouter} from 'react-router'
import type {State} from '../../types'
import type {Robot} from '../../discovery'

type OP = ContextRouter

type SP = {|
  robot: ?Robot,
  filename: ?string,
  uploadInProgress: boolean,
  uploadError: ?{message: string},
  sessionLoaded: boolean,
|}

type Props = {...OP, ...SP}

export default withRouter(connect(mapStateToProps)(UploadPage))

function mapStateToProps (state: State, ownProps: OP): SP {
  return {
    robot: getConnectedRobot(state),
    filename: getProtocolFilename(state),
    uploadInProgress: robotSelectors.getSessionLoadInProgress(state),
    uploadError: robotSelectors.getUploadError(state),
    sessionLoaded: robotSelectors.getSessionIsLoaded(state),
  }
}

function UploadPage (props: Props) {
  const {
    robot,
    filename,
    uploadInProgress,
    uploadError,
    sessionLoaded,
    match: {path},
  } = props

  const fileInfoPath = `${path}/file-info`

  if (!robot) return <Redirect to="/robots" />
  if (!filename) {
    return (
      <Page>
        <Splash />
      </Page>
    )
  }

  return (
    <Switch>
      <Redirect exact from={path} to={fileInfoPath} />
      <Route
        path={fileInfoPath}
        render={props => (
          <FileInfo
            robot={robot}
            filename={filename}
            uploadInProgress={uploadInProgress}
            uploadError={uploadError}
            sessionLoaded={sessionLoaded}
          />
        )}
      />
    </Switch>
  )
}
