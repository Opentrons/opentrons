// @flow
// more nav button routes
import * as React from 'react'
import {Switch, Route, Redirect, type Match} from 'react-router'

import AppSettings from './AppSettings'
import Resources from './Resources'

type Props = {
  match: Match
}

export default function More (props: Props) {
  const {match: {path}} = props
  return (
    <Switch>
      <Redirect exact from={path} to={'/menu/app'} />
      <Route
        path={'/menu/app'}
        component={AppSettings}
      />
      <Route
        path={'/menu/resources'}
        component={Resources}
      />
    </Switch>
  )
}
