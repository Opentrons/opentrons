// @flow
// side nav panel container'
import * as React from 'react'
import { Route, Switch } from 'react-router-dom'

import { CalibratePanel } from '../components/CalibratePanel'
import { ConnectPanel } from '../components/ConnectPanel'
import { MenuPanel } from '../components/MenuPanel'
import { RunPanel } from '../components/RunPanel'
import { UploadPanel } from '../components/UploadPanel'

export function SidePanel(): React.Node {
  return (
    <Switch>
      <Route path="/robots/:name?" component={ConnectPanel} />
      <Route path="/menu" component={MenuPanel} />
      <Route path="/upload" component={UploadPanel} />
      <Route path="/calibrate" component={CalibratePanel} />
      <Route path="/run" component={RunPanel} />
    </Switch>
  )
}
