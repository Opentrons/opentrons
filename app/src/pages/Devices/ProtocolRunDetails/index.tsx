import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Redirect, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  Box,
  Flex,
  DIRECTION_COLUMN,
  DISPLAY_BLOCK,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  OVERFLOW_SCROLL,
  SIZE_1,
  SIZE_6,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { useRobot } from '../../../organisms/Devices/hooks'
import { ProtocolRunHeader } from '../../../organisms/Devices/ProtocolRun/ProtocolRunHeader'

import type {
  NextGenRouteParams,
  ProtocolRunDetailsTab,
} from '../../../App/NextGenApp'

const RoundNavLink = styled(NavLink)`
  ${TYPOGRAPHY.pSemiBold}
  border-radius: ${BORDERS.radiusSoftCorners} ${BORDERS.radiusSoftCorners} 0 0;
  border-top: ${BORDERS.transparentLineBorder};
  border-left: ${BORDERS.transparentLineBorder};
  border-right: ${BORDERS.transparentLineBorder};
  color: ${COLORS.darkGreyEnabled};
  padding: ${SPACING.spacing3} ${SPACING.spacing4};
  position: ${POSITION_RELATIVE};

  &.active {
    background-color: ${COLORS.white};
    border-top: ${BORDERS.lineBorder};
    border-left: ${BORDERS.lineBorder};
    border-right: ${BORDERS.lineBorder};
    color: ${COLORS.blue};

    /* extend below the tab when active to flow into the content */
    &:after {
      position: ${POSITION_ABSOLUTE};
      display: ${DISPLAY_BLOCK};
      content: '';
      background-color: ${COLORS.white};
      top: 100;
      left: 0;
      height: ${SIZE_1};
      width: 100%;
    }
  }
`

interface RoundTabProps {
  to: string
  tabName: string
}

function RoundTab({ to, tabName }: RoundTabProps): JSX.Element {
  return (
    <RoundNavLink to={to} replace>
      {tabName}
    </RoundNavLink>
  )
}

export function ProtocolRunDetails(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const {
    robotName,
    runId,
    protocolRunDetailsTab,
  } = useParams<NextGenRouteParams>()

  const robot = useRobot(robotName)

  const protocolRunDetailsContentByTab: {
    [K in ProtocolRunDetailsTab]: () => JSX.Element
  } = {
    // TODO: setup tab content
    setup: () => <div>setup content</div>,
    // TODO: module controls tab content
    'module-controls': () => <div>module controls content</div>,
    // TODO: run log tab content
    'run-log': () => <div>run log content</div>,
  }

  const ProtocolRunDetailsContent =
    protocolRunDetailsContentByTab[protocolRunDetailsTab] ??
    // default to the setup tab if no tab or nonexistent tab is passed as a param
    (() => (
      <Redirect to={`/devices/${robotName}/protocol-runs/${runId}/setup`} />
    ))

  return robot != null ? (
    <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
      <Box
        minWidth={SIZE_6}
        height="100%"
        overflow={OVERFLOW_SCROLL}
        padding={SPACING.spacing4}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          marginBottom={SPACING.spacing4}
          width="100%"
        >
          <ProtocolRunHeader robotName={robot.name} runId={runId} />
          <Flex>
            <RoundTab
              to={`/devices/${robotName}/protocol-runs/${runId}/setup`}
              tabName={t('setup')}
            />
            <RoundTab
              to={`/devices/${robotName}/protocol-runs/${runId}/module-controls`}
              tabName={t('module_controls')}
            />
            <RoundTab
              to={`/devices/${robotName}/protocol-runs/${runId}/run-log`}
              tabName={t('run_log')}
            />
          </Flex>
          <Box
            backgroundColor={COLORS.white}
            border={`${SPACING.spacingXXS} ${BORDERS.styleSolid} ${COLORS.medGrey}`}
            // remove left upper corner border radius when first tab is active
            borderRadius={`${
              protocolRunDetailsTab === 'setup'
                ? '0'
                : BORDERS.radiusSoftCorners
            } ${BORDERS.radiusSoftCorners} ${BORDERS.radiusSoftCorners} ${
              BORDERS.radiusSoftCorners
            }`}
            padding={`${SPACING.spacing5} ${SPACING.spacing4}`}
          >
            <ProtocolRunDetailsContent />
          </Box>
        </Flex>
      </Box>
    </ApiHostProvider>
  ) : null
}
