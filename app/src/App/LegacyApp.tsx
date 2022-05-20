import * as React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { Box, POSITION_RELATIVE } from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { getConnectedRobot } from '../redux/discovery'
import { Alerts } from '../organisms/Alerts'

import { Upload } from '../pages/Upload'

import { LegacyNavbar } from './LegacyNavbar'
import { PortalRoot as ModalPortalRoot, TopPortalRoot } from './portal'

import type { State } from '../redux/types'

export function LegacyApp(): JSX.Element {
  const connectedRobot = useSelector((state: State) => getConnectedRobot(state))

  return (
    <ApiHostProvider
      hostname={connectedRobot?.ip ?? null}
      robotName={connectedRobot?.name}
    >
      <LegacyNavbar />
      <TopPortalRoot />
      <Box position={POSITION_RELATIVE} width="100%" height="100%">
        <ModalPortalRoot />
        <Switch>
          <Route path="/upload">
            <Upload />
          </Route>
          <Redirect exact from="/" to="/robots" />
          {/* redirect after next gen app feature flag toggle */}
          <Redirect exact from="/app-settings/feature-flags" to="/more" />
        </Switch>
        <Alerts />
      </Box>
    </ApiHostProvider>
  )
}
