// @flow
// upload progress container
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, Route, Switch, Redirect } from 'react-router-dom'

import { selectors as robotSelectors } from '../../robot'
import { getProtocolFilename } from '../../protocol'
import { getConnectedRobot } from '../../discovery'
import { getCustomLabware } from '../../custom-labware'

import { FileInfo } from './FileInfo'

import type { ContextRouter } from 'react-router-dom'
import type { State, Dispatch } from '../../types'
import type { Robot } from '../../discovery/types'

type OP = ContextRouter

type SP = {|
  robot: ?Robot,
  filename: ?string,
  uploadInProgress: boolean,
  uploadError: ?{ message: string },
  sessionLoaded: boolean,
  sessionHasSteps: boolean,
  showCustomLabwareWarning: boolean,
|}

type Props = {| ...OP, ...SP, dispatch: Dispatch |}

export const Upload: React.AbstractComponent<
  $Diff<OP, ContextRouter>
> = withRouter(
  connect<Props, OP, SP, _, _, _>(mapStateToProps)(UploadComponent)
)

function mapStateToProps(state: State): SP {
  return {
    robot: getConnectedRobot(state),
    filename: getProtocolFilename(state),
    uploadInProgress: robotSelectors.getSessionLoadInProgress(state),
    uploadError: robotSelectors.getUploadError(state),
    sessionLoaded: robotSelectors.getSessionIsLoaded(state),
    sessionHasSteps: robotSelectors.getCommands(state).length > 0,
    showCustomLabwareWarning:
      getCustomLabware(state).length > 0 &&
      !robotSelectors
        .getSessionCapabilities(state)
        .includes('create_with_extra_labware'),
  }
}

function UploadComponent(props: Props) {
  const {
    robot,
    filename,
    uploadInProgress,
    uploadError,
    sessionLoaded,
    sessionHasSteps,
    showCustomLabwareWarning,
    match: { path },
  } = props

  const fileInfoPath = `${path}/file-info`

  if (!robot) return <Redirect to="/robots" />

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
            sessionHasSteps={sessionHasSteps}
            showCustomLabwareWarning={showCustomLabwareWarning}
          />
        )}
      />
    </Switch>
  )
}
