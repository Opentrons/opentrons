import * as React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import { AppSettings } from '../pages/More/AppSettings'

/**
 * Component for the next gen app routes and navigation
 * @returns {JSX.Element}
 */
export function NextGenApp(): JSX.Element {
  return (
    <Switch>
      <Route path="/app-settings">
        <AppSettings />
      </Route>
      {/* this redirect from /robots is necessary because the existing app <Redirect /> to /robots renders before feature flags load */}
      <Redirect from="/robots" to="/app-settings" />
      {/* this redirects from the existing app settings page on next gen app feature flag toggle */}
      <Redirect from="/more" to="/app-settings" />
    </Switch>
  )
}
