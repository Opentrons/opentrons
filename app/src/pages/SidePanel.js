// @flow
// side nav panel container
import React from 'react'
import {Switch, Route} from 'react-router'

import ConnectPanel from '../components/ConnectPanel'
import UploadPanel from '../components/UploadPanel'
import SetupPanel from '../components/SetupPanel'
import MenuPanel from '../components/MenuPanel'
import RunPanel from '../components/RunPanel'

export default function NavPanel () {
  return (
    <Switch>
      <Route path='/robots' component={ConnectPanel} />
      <Route path='/menu' component={MenuPanel} />
      <Route path='/upload' component={UploadPanel} />
      <Route path='/calibrate' component={SetupPanel} />
      <Route path='/run' component={RunPanel} />
    </Switch>
  )
}
