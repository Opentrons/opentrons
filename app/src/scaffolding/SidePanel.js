// @flow
// side nav panel container'
import * as React from 'react'
import { Switch, Route } from 'react-router-dom'

import { MorePanel } from '../pages/More/MorePanel'
import { UploadPanel } from '../pages/Upload/UploadPanel'
import { RunPanel } from '../pages/Run/RunPanel'
import { ConnectPanel } from '../pages/Robots/ConnectPanel'
import { CalibratePanel } from '../pages/Calibrate/CalibratePanel'

export function SidePanel(): React.Node {
  return (
    <Switch>
      <Route path="/robots/:name?" component={ConnectPanel} />
      <Route path="/more" component={MorePanel} />
      <Route path="/upload" component={UploadPanel} />
      <Route path="/calibrate" component={CalibratePanel} />
      <Route path="/run" component={RunPanel} />
    </Switch>
  )
}
