// @flow
// more nav button routes
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Switch, Route, Redirect } from 'react-router-dom'

import { getFeatureFlags } from '../../config/selectors'
import AppSettings from './AppSettings'
import CustomLabware from './CustomLabware'
import Resources from './Resources'

import type { ContextRouter } from 'react-router-dom'

export default function More(props: ContextRouter) {
  const featureFlags = useSelector(getFeatureFlags)
  const { path } = props.match
  const appPath = `${path}/app`

  return (
    <Switch>
      <Redirect exact from={path} to={appPath} />
      <Route path={appPath} component={AppSettings} />
      {featureFlags.customLabware && (
        <Route path={`${path}/custom-labware`} component={CustomLabware} />
      )}
      <Route path={`${path}/resources`} component={Resources} />
    </Switch>
  )
}
