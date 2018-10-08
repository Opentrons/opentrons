// @flow
// more nav button routes
import * as React from 'react'
import {Switch, Route, Redirect, type Match} from 'react-router'

import AppSettings from './AppSettings'
import Resources from './Resources'

type Props = {
  match: Match,
}

export default function More (props: Props) {
  const {match: {path}} = props
  const appPath = `${path}/app`

  return (
    <Switch>
      <Redirect exact from={path} to={appPath} />
      <Route
        path={appPath}
        component={AppSettings}
      />
      <Route
        path={`${path}/resources`}
        component={Resources}
      />
    </Switch>
  )
}
