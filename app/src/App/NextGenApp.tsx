import * as React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import {
  Box,
  COLORS,
  OVERFLOW_SCROLL,
  POSITION_RELATIVE,
} from '@opentrons/components'

import { Breadcrumbs } from '../molecules/Breadcrumbs'
import { DeviceDetails } from '../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../pages/Devices/DevicesLanding'
import { ProtocolRunDetails } from '../pages/Devices/ProtocolRunDetails'
import { RobotSettings } from '../pages/Devices/RobotSettings'
import { usePathCrumbs } from './hooks'
import { ProtocolsLanding } from '../pages/Protocols/ProtocolsLanding'
import { ProtocolDetails } from '../pages/Protocols/ProtocolDetails'
import { AppSettings } from '../organisms/AppSettings'
import { Labware } from '../organisms/Labware'
import { PortalRoot as ModalPortalRoot, TopPortalRoot } from './portal'
import { Navbar } from './Navbar'

import type { RouteProps } from './types'

/**
 * Provides localized translation keys to substitute for a path segment, for breadcrumbs or menu
 * `null` indicates that a path segment should not be displayed
 * Localized keys found in unified_app.json
 * TODO(bh, 2021-2-9):: test to iterate over routes and capture defined/undefined/not allowed path segments
 */
export const translationKeyByPathSegment: { [index: string]: string | null } = {
  advanced: null,
  calibration: null,
  'deck-setup': 'deck_setup',
  devices: 'devices',
  'feature-flags': null,
  general: null,
  labware: 'labware',
  'module-controls': null,
  networking: null,
  privacy: null,
  'protocol-runs': 'protocol_runs',
  protocols: 'protocols',
  'robot-settings': 'robot_settings',
  'run-log': null,
  setup: null,
}

export const nextGenRoutes: RouteProps[] = [
  {
    component: ProtocolsLanding,
    exact: true,
    name: 'Protocols',
    navLinkTo: '/protocols',
    path: '/protocols',
  },
  {
    component: ProtocolDetails,
    exact: true,
    name: 'Protocol Details',
    path: '/protocols/:protocolKey',
  },
  {
    component: () => <div>deck setup</div>,
    name: 'Deck Setup',
    path: '/protocols/:protocolKey/deck-setup',
  },
  {
    component: Labware,
    name: 'Labware',
    navLinkTo: '/labware',
    // labwareId param is for details slideout
    path: '/labware/:labwareId?',
  },
  {
    component: DevicesLanding,
    exact: true,
    name: 'Devices',
    navLinkTo: '/devices',
    path: '/devices',
  },
  {
    component: DeviceDetails,
    exact: true,
    name: 'Device Details',
    path: '/devices/:robotName',
  },
  {
    component: RobotSettings,
    exact: true,
    name: 'Robot Settings',
    path: '/devices/:robotName/robot-settings/:robotSettingsTab?',
  },
  {
    component: () => <div>protocol runs landing</div>,
    exact: true,
    name: 'Protocol Runs',
    path: '/devices/:robotName/protocol-runs',
  },
  {
    component: ProtocolRunDetails,
    name: 'Run Details',
    path: '/devices/:robotName/protocol-runs/:runId/:protocolRunDetailsTab?',
  },
  {
    component: AppSettings,
    exact: true,
    name: 'App Settings',
    path: '/app-settings/:appSettingsTab?',
  },
]

/**
 * Component for the next gen app routes and navigation
 * @returns {JSX.Element}
 */
export function NextGenApp(): JSX.Element {
  const pathCrumbs = usePathCrumbs()

  return (
    <>
      <TopPortalRoot />
      <Navbar routes={nextGenRoutes} />
      <Box width="100%">
        <Breadcrumbs pathCrumbs={pathCrumbs} />
        <Box
          position={POSITION_RELATIVE}
          width="100%"
          height="100%"
          backgroundColor={COLORS.background}
          overflow={OVERFLOW_SCROLL}
        >
          <ModalPortalRoot />
          <Switch>
            {nextGenRoutes.map(({ component, exact, path }: RouteProps) => {
              return (
                <Route
                  key={path}
                  component={component}
                  exact={exact}
                  path={path}
                />
              )
            })}
            {/* this redirect from /robots is necessary because the existing app <Redirect /> to /robots renders before feature flags load */}
            <Redirect from="/robots" to="/devices" />
          </Switch>
        </Box>
      </Box>
    </>
  )
}
