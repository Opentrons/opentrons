import * as React from 'react'
import { NavLink, Redirect, Route, Switch } from 'react-router-dom'
import styled from 'styled-components'

import {
  Box,
  Flex,
  BORDER_SOLID_LIGHT,
  C_NEAR_WHITE,
  DIRECTION_COLUMN,
  FLEX_NONE,
  OVERFLOW_SCROLL,
  POSITION_RELATIVE,
  SIZE_4,
  SPACING_2,
} from '@opentrons/components'

import { AppSettings } from '../pages/More/AppSettings'
import { DeviceDetails } from '../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../pages/Devices/DevicesLanding'

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
  /**
   * navigational tier, for temp nav and perhaps breadcrumb when implemented
   */
  tier: number
}

const TempNavBarLink = styled(NavLink)<{ tier: number; lastRoute: boolean }>`
  padding-left: ${props => (props.tier - 1) * 5}px;
  margin-top: ${props => (props.lastRoute ? 'auto' : 0)};
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
      flexDirection={DIRECTION_COLUMN}
      flex={FLEX_NONE}
      width={SIZE_4}
      borderRight={BORDER_SOLID_LIGHT}
      margin={SPACING_2}
    >
      {navRoutes.map(({ name, navLinkTo, tier }: RouteProps, i: number) => (
        <TempNavBarLink
          key={name}
          to={navLinkTo as string}
          lastRoute={i === navRoutes.length - 1}
          tier={tier}
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
  protocolId: string
  labwareId: string
  robotSettingsTab: string
  runDetailsTab: string
}

/**
 * Component for the next gen app routes and navigation
 * @returns {JSX.Element}
 */
export function NextGenApp(): JSX.Element {
  // TODO(bh, 2021-12-10): i18n for route name once final nav/breadcrumbs implemented
  const nextGenRoutes: RouteProps[] = [
    {
      component: () => <div>protocols landing</div>,
      exact: true,
      name: 'Protocols',
      navLinkTo: '/protocols',
      path: '/protocols',
      tier: 1,
    },
    {
      component: () => <div>protocol details</div>,
      exact: true,
      name: 'Protocol Details',
      path: '/protocols/:protocolId',
      tier: 2,
    },
    {
      component: () => <div>deck setup</div>,
      name: 'Deck Setup',
      path: '/protocols/:protocolId/deck-setup',
      tier: 3,
    },
    {
      component: () => <div>labware landing</div>,
      name: 'Labware',
      navLinkTo: '/labware',
      // labwareId param is for details slideout
      path: '/labware/:labwareId?',
      tier: 1,
    },
    {
      component: DevicesLanding,
      exact: true,
      name: 'Devices',
      navLinkTo: '/devices',
      path: '/devices',
      tier: 1,
    },
    {
      component: DeviceDetails,
      exact: true,
      name: 'Device Details',
      path: '/devices/:robotName',
      tier: 2,
    },
    {
      component: () => <div>robot settings</div>,
      exact: true,
      name: 'Robot Settings',
      // robot settings tabs params: 'calibration' | 'networking' | 'advanced'
      path: '/devices/:robotName/robot-settings/:robotSettingsTab',
      tier: 3,
    },
    {
      component: () => <div>protocol runs landing</div>,
      exact: true,
      name: 'Protocol Runs',
      path: '/devices/:robotName/protocol-runs',
      tier: 3,
    },
    {
      component: () => <div>protocol run details page</div>,
      name: 'Run Details',
      // run details tabs params: 'setup' | 'run'
      path: '/devices/:robotName/protocol-runs/:runDetailsTab',
      tier: 4,
    },
    {
      component: AppSettings,
      name: 'App Settings',
      navLinkTo: '/app-settings/feature-flags',
      // app settings tabs params: 'general' | 'privacy' | 'advanced' | 'feature-flags'
      path: '/app-settings/:appSettingsTab',
      tier: 1,
    },
  ]
  return (
    <>
      <TempNavBar routes={nextGenRoutes} />
      <Box
        position={POSITION_RELATIVE}
        width="100%"
        height="100%"
        backgroundColor={C_NEAR_WHITE}
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
    </>
  )
}
