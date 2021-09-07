// Upload Page
import * as React from 'react'
import { useSelector } from 'react-redux'
import { useRouteMatch, Route, Switch, Redirect } from 'react-router-dom'

import { useFeatureFlag } from '../../redux/config'
import { selectors as robotSelectors } from '../../redux/robot'
import { getProtocolFilename } from '../../redux/protocol'
import { getConnectedRobot } from '../../redux/discovery'
import { getCustomLabware } from '../../redux/custom-labware'

import { FileInfo } from './FileInfo'
import { ProtocolUpload } from '../../organisms/ProtocolUpload'
import type { State } from '../../redux/types'

export function Upload(): JSX.Element {
  const robot = useSelector((state: State) => getConnectedRobot(state))
  const filename = useSelector((state: State) => getProtocolFilename(state))
  const uploadInProgress = useSelector((state: State) =>
    robotSelectors.getSessionLoadInProgress(state)
  )
  const uploadError = useSelector((state: State) =>
    robotSelectors.getUploadError(state)
  )
  const sessionLoaded = useSelector((state: State) =>
    robotSelectors.getSessionIsLoaded(state)
  )
  const sessionHasSteps = useSelector(
    (state: State) => robotSelectors.getCommands(state).length > 0
  )
  const showCustomLabwareWarning = useSelector(
    (state: State) =>
      getCustomLabware(state).length > 0 &&
      !robotSelectors
        .getSessionCapabilities(state)
        .includes('create_with_extra_labware')
  )
  const { path } = useRouteMatch()

  const isNewProtocolUploadPage = useFeatureFlag('preProtocolFlowWithoutRPC')

  const fileInfoPath = `${path}/file-info`

  if (robot == null) return <Redirect to="/robots" />
  return (
    <Switch>
      <Redirect exact from={path} to={fileInfoPath} />
      <Route
        path={fileInfoPath}
        render={props => {
          return Boolean(isNewProtocolUploadPage) ? (
            <ProtocolUpload />
          ) : (
            <FileInfo
              robot={robot}
              filename={filename}
              uploadInProgress={uploadInProgress}
              uploadError={uploadError}
              sessionLoaded={sessionLoaded}
              sessionHasSteps={sessionHasSteps}
              showCustomLabwareWarning={showCustomLabwareWarning}
            />
          )
        }}
      />
    </Switch>
  )
}
