// @flow
import * as React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { createGlobalStyle } from 'styled-components'

import 'typeface-open-sans'

import {
  Flex,
  Box,
  C_DARK_GRAY,
  POSITION_RELATIVE,
  POSITION_FIXED,
  DIRECTION_ROW,
} from '@opentrons/components'

import { Robots } from '../../pages/Robots'
import { More } from '../../pages/More'
import { Upload } from '../../pages/Upload'
import { Calibrate } from '../../pages/Calibrate'
import { Run } from '../../pages/Run'
import { SidePanel } from '../../pages/SidePanel'
import { Navbar } from '../Navbar'
import { Alerts } from '../Alerts'
import { PortalRoot as ModalPortalRoot } from '../portal'

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Open Sans', sans-serif;
  }

  html,
  body {
    width: 100%;
    height: 100%;
    color: ${C_DARK_GRAY};
  }

  a {
    text-decoration: none;
  }

  button {
    border: none;

    &:focus,
    &:active {
      outline: 0;
    }
  }
`

const stopEvent = (event: SyntheticEvent<>) => event.preventDefault()

export function App(): React.Node {
  return (
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
        <SidePanel />
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
      </Flex>
    </>
  )
}
