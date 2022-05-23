import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  Box,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SIZE_3,
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
  const unhealthyReachableRobots = useSelector((state: State) =>
    getReachableRobots(state)
  )
  const unreachableRobots = useSelector((state: State) =>
    getUnreachableRobots(state)
  )

  const noRobots =
    [
      ...healthyReachableRobots,
      ...unhealthyReachableRobots,
      ...unreachableRobots,
    ].length === 0

  return (
    <Box minWidth={SIZE_6} padding={`${SPACING.spacing3} ${SPACING.spacing4}`}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <StyledText as="h3" id="DevicesLanding_title">
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
            title={t('available', { count: healthyReachableRobots.length })}
          >
            {healthyReachableRobots.map(robot => (
              <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
                <RobotCard robot={robot} />
              </ApiHostProvider>
            ))}
          </CollapsibleSection>
          <Divider />
          <CollapsibleSection
            marginY={SPACING.spacing4}
            title={t('unavailable', {
              count: [...unhealthyReachableRobots, ...unreachableRobots].length,
            })}
            isExpandedInitially={healthyReachableRobots.length === 0}
          >
            {unhealthyReachableRobots.map(robot => (
              <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
                <RobotCard robot={robot} />
              </ApiHostProvider>
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
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
    >
      <StyledText as="h3" marginBottom={SPACING.spacing3}>
        {t('looking_for_robots')}
      </StyledText>
      <Icon name="ot-spinner" spin size={SIZE_3} />
      <ExternalLink
        href={TROUBLESHOOTING_CONNECTION_PROBLEMS_URL}
        id="DevicesEmptyState_troubleshootingConnectionProblems"
      >
        {t('troubleshooting_connection_problems')}
        <Icon
          name="open-in-new"
          size="0.675rem"
          marginLeft={SPACING.spacing2}
        />
      </ExternalLink>
    </Flex>
  )
}
