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
  SIZE_6,
  SPACING,
  COLORS,
  Link,
  TYPOGRAPHY,
  POSITION_ABSOLUTE,
  DISPLAY_FLEX,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'
import {
  getScanning,
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
  OPENTRONS_USB,
} from '../../../redux/discovery'
import { appShellRequestor } from '../../../redux/shell/remote'
import { RobotCard } from '../../../organisms/Devices/RobotCard'
import { DevicesEmptyState } from '../../../organisms/Devices/DevicesEmptyState'
import { CollapsibleSection } from '../../../molecules/CollapsibleSection'

import { Divider } from '../../../atoms/structure'
import { StyledText } from '../../../atoms/text'
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
    <Box minWidth={SIZE_6} padding={`${SPACING.spacing8} ${SPACING.spacing16}`}>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        marginTop={SPACING.spacing8}
        height="2.25rem"
      >
        <StyledText as="h1" id="DevicesLanding_title">
          {t('devices')}
        </StyledText>
        <NewRobotSetupHelp />
      </Flex>
      {isScanning && noRobots ? <DevicesLoadingState /> : null}
      {!isScanning && noRobots ? <DevicesEmptyState /> : null}
      {!noRobots ? (
        <>
          <CollapsibleSection
            gridGap={SPACING.spacing4}
            marginY={SPACING.spacing8}
            title={t('available', {
              count: [...healthyReachableRobots, ...unhealthyReachableRobots]
                .length,
            })}
          >
            {healthyReachableRobots.map(robot => (
              <ApiHostProvider
                key={robot.name}
                hostname={robot.ip ?? null}
                requestor={
                  robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined
                }
              >
                <RobotCard robot={robot} />
              </ApiHostProvider>
            ))}
            {unhealthyReachableRobots.map(robot => (
              <ApiHostProvider
                key={robot.name}
                hostname={robot.ip ?? null}
                requestor={
                  robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined
                }
              >
                <RobotCard robot={robot} />
              </ApiHostProvider>
            ))}
          </CollapsibleSection>
          <Divider />
          <CollapsibleSection
            gridGap={SPACING.spacing4}
            marginY={SPACING.spacing16}
            title={t('not_available', {
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
      ) : null}
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
        size="3.25rem"
        marginTop={SPACING.spacing16}
        marginBottom={SPACING.spacing16}
        color={COLORS.darkGreyEnabled}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        position={POSITION_ABSOLUTE}
        bottom={SPACING.spacing40}
        left="0"
        right="0"
        marginLeft={SPACING.spacingAuto}
        marginRight={SPACING.spacingAuto}
        textAlign={TYPOGRAPHY.textAlignCenter}
      >
        <Link
          css={TYPOGRAPHY.darkLinkLabelSemiBold}
          external
          href={TROUBLESHOOTING_CONNECTION_PROBLEMS_URL}
          display={DISPLAY_FLEX}
          alignItems={ALIGN_CENTER}
          id="DevicesEmptyState_troubleshootingConnectionProblems"
        >
          {t('troubleshooting_connection_problems')}
          <Icon
            name="open-in-new"
            size="0.5rem"
            marginLeft={SPACING.spacing4}
          />
        </Link>
      </Flex>
    </Flex>
  )
}
