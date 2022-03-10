import * as React from 'react'
import { NavLink, Redirect, Route, Switch, Link } from 'react-router-dom'
import styled from 'styled-components'

import {
  Box,
  Flex,
  COLORS,
  Icon,
  DIRECTION_COLUMN,
  FLEX_NONE,
  OVERFLOW_SCROLL,
  POSITION_RELATIVE,
  SPACING,
  TYPOGRAPHY,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
} from '@opentrons/components'

import { Breadcrumbs } from '../molecules/Breadcrumbs'
import { DeviceDetails } from '../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../pages/Devices/DevicesLanding'
import { ProtocolRunDetails } from '../pages/Devices/ProtocolRunDetails'
import { RobotSettings } from '../pages/Devices/RobotSettings'
import { usePathCrumbs } from './hooks'
import { ProtocolsLanding } from '../pages/Protocols/ProtocolsLanding'
import { AppSettings } from '../organisms/AppSettings'
import { Labware } from '../organisms/Labware'
import { PortalRoot as ModalPortalRoot, TopPortalRoot } from './portal'

export interface RouteProps {
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
export function TempNavBar({ routes }: { routes: RouteProps[] }): JSX.Element {
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
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        flex={FLEX_NONE}
        alignItems={ALIGN_FLEX_START}
      >
        {navRoutes.map(({ name, navLinkTo }: RouteProps, i: number) => (
          <TempNavBarLink
            key={name}
            to={navLinkTo as string}
            lastRoute={i === navRoutes.length}
          >
            {name}
          </TempNavBarLink>
        ))}
      </Flex>
      <Link to="/app-settings/general">
        <Icon
          width={SPACING.spacing6}
          name="settings"
          marginBottom={SPACING.spacing3}
          color={COLORS.white}
        ></Icon>
      </Link>
    </Flex>
  )
}

export type RobotSettingsTab = 'calibration' | 'networking' | 'advanced'
export type AppSettingsTab =
  | 'general'
  | 'privacy'
  | 'advanced'
  | 'feature-flags'

export type ProtocolRunDetailsTab = 'setup' | 'module-controls' | 'run-log'

/**
 * route params type definition for the next gen app
 */
export interface NextGenRouteParams {
  appSettingsTab: AppSettingsTab
  robotName: string
  protocolName: string
  labwareId: string
  robotSettingsTab: RobotSettingsTab
  runId: string
  protocolRunDetailsTab: ProtocolRunDetailsTab
}

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
