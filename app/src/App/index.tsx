import * as React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { hot } from 'react-hot-loader/root'

import {
  Flex,
  Box,
  POSITION_RELATIVE,
  POSITION_FIXED,
  DIRECTION_ROW,
} from '@opentrons/components'

import { GlobalStyle } from '../atoms/GlobalStyle'
import { Alerts } from '../organisms/Alerts'

import { Robots } from '../pages/Robots'
import { Upload } from '../pages/Upload'
import { Calibrate } from '../pages/Calibrate'
import { Run } from '../pages/Run'
import { More } from '../pages/More'

import { ConnectPanel } from '../pages/Robots/ConnectPanel'
import { UploadPanel } from '../pages/Upload/UploadPanel'
import { CalibratePanel } from '../pages/Calibrate/CalibratePanel'
import { RunPanel } from '../pages/Run/RunPanel'
import { MorePanel } from '../pages/More/MorePanel'

import { Navbar } from './Navbar'
import { PortalRoot as ModalPortalRoot, TopPortalRoot } from './portal'

const stopEvent = (event: React.MouseEvent): void => event.preventDefault()

export const AppComponent = (): JSX.Element => (
  <>
    <GlobalStyle />
    <Flex
      position={POSITION_FIXED}
      flexDirection={DIRECTION_ROW}
      width="100%"
      height="100vh"
      onDragOver={stopEvent}
      onDrop={stopEvent}
    >
      <Navbar />
      <Switch>
        <Route path="/robots/:name?" component={ConnectPanel} />
        <Route path="/more" component={MorePanel} />
        <Route path="/upload" component={UploadPanel} />
        <Route path="/calibrate" component={CalibratePanel} />
        <Route path="/run" component={RunPanel} />
      </Switch>
      <Box position={POSITION_RELATIVE} width="100%" height="100%">
        <Switch>
          <Route path="/robots/:name?">
            <Robots />
          </Route>
          <Route path="/more">
            <More />
          </Route>
          <Route path="/upload">
            <Upload />
          </Route>
          <Route path="/calibrate">
            <Calibrate />
          </Route>
          <Route path="/run">
            <Run />
          </Route>
          <Redirect exact from="/" to="/robots" />
        </Switch>
        <ModalPortalRoot />
        <Alerts />
      </Box>
      <TopPortalRoot />
    </Flex>
  </>
)

export const App = hot(AppComponent)
