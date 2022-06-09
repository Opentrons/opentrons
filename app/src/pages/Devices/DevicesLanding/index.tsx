import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import partition from 'lodash/partition'

import {
  Box,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SIZE_2,
  SIZE_6,
  SPACING,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'
import {
  getScanning,
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
} from '../../../redux/discovery'
import { RobotCard } from '../../../organisms/Devices/RobotCard'
import { DevicesEmptyState } from '../../../organisms/Devices/DevicesEmptyState'
import { CollapsibleSection } from '../../../molecules/CollapsibleSection'

import { Divider } from '../../../atoms/structure'
import { StyledText } from '../../../atoms/text'
import { ExternalLink } from '../../../atoms/Link/ExternalLink'
import { NewRobotSetupHelp } from './NewRobotSetupHelp'

import type { State } from '../../../redux/types'

export const TROUBLESHOOTING_CONNECTION_PROBLEMS_URL =
  'https://support.opentrons.com/en/articles/2687601-troubleshooting-connection-problems'

export function DevicesLanding(): JSX.Element {
  const { t } = useTranslation('devices_landing')

  const isScanning = useSelector((state: State) => getScanning(state))
  const healthyReachableRobots = useSelector((state: State) =>
    getConnectableRobots(state)
  )
  const reachableRobots = useSelector((state: State) =>
    getReachableRobots(state)
  )
  const unreachableRobots = useSelector((state: State) =>
    getUnreachableRobots(state)
  )

  const [unhealthyReachableRobots, recentlySeenRobots] = partition(
    reachableRobots,
    robot => robot.healthStatus === 'ok'
  )

  const noRobots =
    [
      ...healthyReachableRobots,
      ...recentlySeenRobots,
      ...unhealthyReachableRobots,
      ...unreachableRobots,
    ].length === 0

  return (
    <Box minWidth={SIZE_6} padding={`${SPACING.spacing3} ${SPACING.spacing4}`}>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        marginTop={SPACING.spacing3}
      >
        <StyledText as="h1" id="DevicesLanding_title">
          {t('devices')}
        </StyledText>
        <NewRobotSetupHelp />
      </Flex>
      {isScanning && noRobots ? <DevicesLoadingState /> : null}
      {!isScanning && noRobots ? (
        <DevicesEmptyState />
      ) : (
        <>
          <CollapsibleSection
            marginY={SPACING.spacing4}
            title={t('available', {
              count: [...healthyReachableRobots, ...unhealthyReachableRobots]
                .length,
            })}
          >
            {healthyReachableRobots.map(robot => (
              <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
                <RobotCard robot={robot} />
              </ApiHostProvider>
            ))}
            {unhealthyReachableRobots.map(robot => (
              <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
                <RobotCard robot={robot} />
              </ApiHostProvider>
            ))}
          </CollapsibleSection>
          <Divider />
          <CollapsibleSection
            marginY={SPACING.spacing4}
            title={t('unavailable', {
              count: [...recentlySeenRobots, ...unreachableRobots].length,
            })}
            isExpandedInitially={healthyReachableRobots.length === 0}
          >
            {recentlySeenRobots.map(robot => (
              <RobotCard key={robot.name} robot={{ ...robot, local: null }} />
            ))}
            {unreachableRobots.map(robot => (
              <RobotCard key={robot.name} robot={robot} />
            ))}
          </CollapsibleSection>
        </>
      )}
    </Box>
  )
}

function DevicesLoadingState(): JSX.Element {
  const { t } = useTranslation('devices_landing')
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      marginTop="10vh"
      marginBottom="10vh"
    >
      <StyledText as="h1">{t('looking_for_robots')}</StyledText>
      <Icon
        name="ot-spinner"
        aria-label="ot-spinner"
        spin
        size={SIZE_2}
        marginTop={SPACING.spacing4}
        marginBottom={SPACING.spacing4}
      />
      <ExternalLink
        href={TROUBLESHOOTING_CONNECTION_PROBLEMS_URL}
        id="DevicesEmptyState_troubleshootingConnectionProblems"
      >
        {t('troubleshooting_connection_problems')}
      </ExternalLink>
    </Flex>
  )
}
