// @flow
import * as React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import styled, { createGlobalStyle } from 'styled-components'

import 'typeface-open-sans'

import { C_DARK_GRAY } from '@opentrons/components'
import { Robots } from '../../pages/Robots'
import { More } from '../../pages/More'
import { Upload } from '../../pages/Upload'
import { Calibrate } from '../../pages/Calibrate'
import { Run } from '../../pages/Run'
import { SidePanel } from '../../pages/SidePanel'
import { NavBar } from '../nav-bar'
import { Alerts } from '../Alerts'
import { PortalRoot as ModalPortalRoot } from '../portal'

import type { StyledComponent } from 'styled-components'

const Wrapper: StyledComponent<{||}, {||}, HTMLDivElement> = styled.div`
  display: flex;
  position: fixed;
  width: 100%;
  height: 100vh;
  flex-direction: row;
  font-family: 'Open Sans';
`

const PageWrapper: StyledComponent<{||}, {||}, HTMLDivElement> = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

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
      <Wrapper onDragOver={stopEvent} onDrop={stopEvent}>
        <NavBar />
        <SidePanel />
        <PageWrapper>
          <Switch>
            <Route path="/robots/:name?">
              <Robots />
            </Route>
            <Route path="/menu">
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
        </PageWrapper>
      </Wrapper>
    </>
  )
}
