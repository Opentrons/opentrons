// Upload Page
import * as React from 'react'
import { useSelector } from 'react-redux'
import { useRouteMatch, Route, Switch, Redirect } from 'react-router-dom'

import { getConnectedRobot } from '../../redux/discovery'

import { ProtocolUpload } from '../../organisms/ProtocolUpload'
import type { State } from '../../redux/types'

export function Upload(): JSX.Element {
  const robot = useSelector((state: State) => getConnectedRobot(state))

  const { path } = useRouteMatch()

  const fileInfoPath = `${path}/file-info`

  if (robot == null) return <Redirect to="/robots" />
  return (
    <Switch>
      <Redirect exact from={path} to={fileInfoPath} />
      <Route
        path={fileInfoPath}
        render={props => {
          return <ProtocolUpload />
        }}
      />
    </Switch>
  )
}
