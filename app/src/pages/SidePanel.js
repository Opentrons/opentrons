// @flow
// side nav panel container
import React from 'react'
import { Switch, Route } from 'react-router-dom'

import { ConnectPanel } from '../components/ConnectPanel'
import { UploadPanel } from '../components/UploadPanel'
import { CalibratePanel } from '../components/CalibratePanel'
import { MenuPanel } from '../components/MenuPanel'
import { RunPanel } from '../components/RunPanel'

export function SidePanel() {
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
