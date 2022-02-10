import * as React from 'react'
import { NavLink, Redirect, Route, Switch } from 'react-router-dom'
import styled from 'styled-components'

import {
  Box,
  Flex,
  COLORS,
  DIRECTION_COLUMN,
  FLEX_NONE,
  OVERFLOW_SCROLL,
  POSITION_RELATIVE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Breadcrumbs } from '../molecules/Breadcrumbs'
import { AppSettings } from '../pages/More/AppSettings'
import { DeviceDetails } from '../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../pages/Devices/DevicesLanding'
import { usePathCrumbs } from './hooks'

interface RouteProps {
  /**
   * the component rendered by a route match
   * drop developed components into slots held by placeholder div components
   */
  component: () => JSX.Element | null
  exact?: boolean
  /**
   * a route/page name to render in the temp nav bar
   */
  name: string
  /**
   * the path for navigation linking, for example to push to a default tab
   * some of these links are temp (and params hardcoded) until final nav and breadcrumbs implemented
   */
  navLinkTo?: string
  path: string
}

const TempNavBarLink = styled(NavLink)<{ lastRoute: boolean }>`
  color: ${COLORS.white};
  opacity: 0.8;
  margin-top: ${props => (props.lastRoute ? 'auto' : SPACING.spacing4)};
`

/**
 * a temp nav bar to facilitate app navigation during development until breadcrumbs are implemented
 * @param routes
 * @returns {JSX.Element}
 */
function TempNavBar({ routes }: { routes: RouteProps[] }): JSX.Element {
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )
  return (
    <Flex
      backgroundColor={COLORS.darkBlack}
      css={TYPOGRAPHY.h3Regular}
      flexDirection={DIRECTION_COLUMN}
      flex={FLEX_NONE}
      width="6rem"
      padding={SPACING.spacing4}
    >
      {navRoutes.map(({ name, navLinkTo }: RouteProps, i: number) => (
        <TempNavBarLink
          key={name}
          to={navLinkTo as string}
          lastRoute={i === navRoutes.length - 1}
        >
          {name}
        </TempNavBarLink>
      ))}
    </Flex>
  )
}

/**
 * route params type definition for the next gen app
 */
export interface NextGenRouteParams {
  appSettingsTab: string
  robotName: string
  protocolName: string
  labwareId: string
  robotSettingsTab: string
  runId: string
  runDetailsTab: string
}

/**
 * Provides localized display name key to substitute for a path segment, for breadcrumbs or menu
 * `null` indicates that a path segment should not be displayed
 * Localized keys found in unified_app.json
 * TODO(bh, 2021-2-9):: test to iterate over routes and capture defined/undefined/not allowed path segments
 */
export const displayNameByPathSegment: { [index: string]: string | null } = {
  advanced: null,
  calibration: null,
  'deck-setup': 'deck_setup',
  devices: 'devices',
  'feature-flags': null,
  general: null,
  labware: 'labware',
  networking: null,
  privacy: null,
  'protocol-runs': 'protocol_runs',
  protocols: 'protocols',
  'robot-settings': 'robot_settings',
  run: null,
  setup: null,
}

export const nextGenRoutes: RouteProps[] = [
  {
    component: () => <div>protocols landing</div>,
    exact: true,
    name: 'Protocols',
    navLinkTo: '/protocols',
    path: '/protocols',
  },
  {
    component: () => <div>protocol details</div>,
    exact: true,
    name: 'Protocol Details',
    path: '/protocols/:protocolName',
  },
  {
    component: () => <div>deck setup</div>,
    name: 'Deck Setup',
    path: '/protocols/:protocolName/deck-setup',
  },
  {
    component: () => <div>labware landing</div>,
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
    component: () => <div>robot settings</div>,
    exact: true,
    name: 'Robot Settings',
    // robot settings tabs params: 'calibration' | 'networking' | 'advanced'
    path: '/devices/:robotName/robot-settings/:robotSettingsTab',
  },
  {
    component: () => <div>protocol runs landing</div>,
    exact: true,
    name: 'Protocol Runs',
    path: '/devices/:robotName/protocol-runs',
  },
  {
    component: () => <div>protocol run details page</div>,
    name: 'Run Details',
    // run details tabs params: 'setup' | 'run'
    path: '/devices/:robotName/protocol-runs/:runId/:runDetailsTab',
  },
  {
    component: AppSettings,
    name: 'App Settings',
    navLinkTo: '/app-settings/feature-flags',
    // app settings tabs params: 'general' | 'privacy' | 'advanced' | 'feature-flags'
    path: '/app-settings/:appSettingsTab',
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
      <TempNavBar routes={nextGenRoutes} />
      <Box width="100%">
        <Breadcrumbs pathCrumbs={pathCrumbs} />
        <Box
          position={POSITION_RELATIVE}
          width="100%"
          height="100%"
          backgroundColor={COLORS.background}
          overflow={OVERFLOW_SCROLL}
        >
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
            {/* this redirects from the existing app settings page on next gen app feature flag toggle */}
            <Redirect from="/more" to="/app-settings/feature-flags" />
          </Switch>
        </Box>
      </Box>
    </>
  )
}
