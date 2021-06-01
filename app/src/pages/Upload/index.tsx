// upload progress container
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, Route, Switch, Redirect } from 'react-router-dom'

import { selectors as robotSelectors } from '../../redux/robot'
import { getProtocolFilename } from '../../redux/protocol'
import { getConnectedRobot } from '../../redux/discovery'
import { getCustomLabware } from '../../redux/custom-labware'

import { FileInfo } from './FileInfo'

import type { RouteComponentProps } from 'react-router-dom'
import type { State } from '../../redux/types'
import type { Robot } from '../../redux/discovery/types'

type OP = RouteComponentProps<{ path: string }>

interface SP {
  robot: Robot | null | undefined
  filename: string | null | undefined
  uploadInProgress: boolean
  uploadError: { message: string } | null | undefined
  sessionLoaded: boolean
  sessionHasSteps: boolean
  showCustomLabwareWarning: boolean
}

type Props = OP & SP

export const Upload = withRouter(connect(mapStateToProps, {})(UploadComponent))

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

function UploadComponent(props: Props): JSX.Element {
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
