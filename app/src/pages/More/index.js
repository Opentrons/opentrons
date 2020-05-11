// @flow
// more nav button routes
import * as React from 'react'
import { useRouteMatch, Switch, Route, Redirect } from 'react-router-dom'

import { AppSettings } from './AppSettings'
import { CustomLabware } from './CustomLabware'
import { NetworkAndSystem } from './NetworkAndSystem'
import { Resources } from './Resources'

export function More() {
  const { path } = useRouteMatch()
  const appPath = `${path}/app`

  return (
    <Switch>
      <Redirect exact from={path} to={appPath} />
      <Route path={appPath} component={AppSettings} />
      <Route path={`${path}/custom-labware`} component={CustomLabware} />
      <Route path={`${path}/network-and-system`} component={NetworkAndSystem} />
      <Route path={`${path}/resources`} component={Resources} />
    </Switch>
  )
}
