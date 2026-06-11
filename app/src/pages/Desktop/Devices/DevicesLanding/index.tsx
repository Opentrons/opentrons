import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import partition from 'lodash/partition'

import {
  ALIGN_CENTER,
  ALIGN_END,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  Icon,
  InputField,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  Link,
  POSITION_ABSOLUTE,
  SIZE_6,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { Divider } from '/app/atoms/structure'
import { CollapsibleSection } from '/app/molecules/CollapsibleSection'
import { DevicesEmptyState } from '/app/organisms/Desktop/Devices/DevicesEmptyState'
import { RobotCard } from '/app/organisms/Desktop/Devices/RobotCard'
import { RobotCertRotator } from '/app/organisms/Desktop/RobotCertImport/RobotCertRotator'
import { useFeatureFlag } from '/app/redux/config'
import {
  getConnectableRobots,
  getReachableRobots,
  getScanning,
  getUnreachableRobots,
  OPENTRONS_USB,
} from '/app/redux/discovery'
import { useAccessTokenForRobot } from '/app/redux/robot-auth'
import { appShellUSBRequestor } from '/app/redux/shell/remote'

import { NewRobotSetupHelp } from './NewRobotSetupHelp'

import type { ReactNode } from 'react'
import type { DiscoveredRobot } from '/app/redux/discovery/types'
import type { State } from '/app/redux/types'

export const TROUBLESHOOTING_CONNECTION_PROBLEMS_URL =
  'https://support.opentrons.com/en/articles/2687601-troubleshooting-connection-problems'

export function DevicesLanding(): JSX.Element {
  const { t } = useTranslation('devices_landing')
  const showSearchBar = useFeatureFlag('robotSearchBar')

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

  const [searchQuery, setSearchQuery] = useState('')

  const filterRobots = useCallback(
    (robots: DiscoveredRobot[]): DiscoveredRobot[] => {
      const query = searchQuery.toLowerCase().trim()
      if (query === '') {
        return robots
      } else {
        return robots.filter(robot => {
          const name = robot.name.toLowerCase()
          const model = robot.robotModel.toLowerCase()

          return name.includes(query) || model.includes(query)
        })
      }
    },
    [searchQuery]
  )

  const filteredHealthy = filterRobots(healthyReachableRobots)
  const filteredUnhealthy = filterRobots(unhealthyReachableRobots)
  const filteredRecentlySeen = filterRobots(recentlySeenRobots)
  const filteredUnreachable = filterRobots(unreachableRobots)

  const noRobots =
    [
      ...filteredHealthy,
      ...filteredRecentlySeen,
      ...filteredUnhealthy,
      ...filteredUnreachable,
    ].length === 0

  return (
    <Box minWidth={SIZE_6} padding={`${SPACING.spacing8} ${SPACING.spacing16}`}>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        marginTop={SPACING.spacing8}
        height="2.25rem"
      >
        <LegacyStyledText forwardedAs="h1" id="DevicesLanding_title">
          {t('devices')}
        </LegacyStyledText>
        <NewRobotSetupHelp />
      </Flex>
      {showSearchBar ? (
        <Flex
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_END}
          width="33%"
          marginLeft={SPACING.spacingAuto}
        >
          <InputField
            placeholder={t('search_robots')}
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
            }}
            leftElement={
              <Icon name="search" size="1rem" color={COLORS.grey50} />
            }
            size="small"
          />
        </Flex>
      ) : null}
      {isScanning && noRobots ? <DevicesLoadingState /> : null}
      {!isScanning && noRobots ? <DevicesEmptyState /> : null}
      {!noRobots ? (
        <>
          <CollapsibleSection
            gridGap={SPACING.spacing4}
            marginY={SPACING.spacing8}
            title={t('available', {
              count: [...filteredHealthy, ...filteredUnhealthy].length,
            })}
          >
            {filteredHealthy.map(robot => (
              <ApiHostProviderForRobot key={robot.name} robot={robot}>
                <RobotCertRotator>
                  <RobotCard robot={robot} />
                </RobotCertRotator>
              </ApiHostProviderForRobot>
            ))}
            {filteredUnhealthy.map(robot => (
              <ApiHostProviderForRobot key={robot.name} robot={robot}>
                <RobotCard robot={robot} />
              </ApiHostProviderForRobot>
            ))}
          </CollapsibleSection>
          <Divider />
          <CollapsibleSection
            gridGap={SPACING.spacing4}
            marginY={SPACING.spacing16}
            title={t('not_available', {
              count: [...filteredRecentlySeen, ...filteredUnreachable].length,
            })}
            isExpandedInitially={filteredHealthy.length === 0}
          >
            {filteredRecentlySeen.map(robot => (
              <RobotCard key={robot.name} robot={{ ...robot, local: null }} />
            ))}
            {filteredUnreachable.map(robot => (
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
      <LegacyStyledText forwardedAs="h1">
        {t('looking_for_robots')}
      </LegacyStyledText>
      <Icon
        name="ot-spinner"
        aria-label="ot-spinner"
        spin
        size="3.25rem"
        marginTop={SPACING.spacing16}
        marginBottom={SPACING.spacing16}
        color={COLORS.grey50}
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

function ApiHostProviderForRobot(props: {
  robot: DiscoveredRobot
  children: ReactNode
}): JSX.Element {
  const { robot, children } = props
  const token = useAccessTokenForRobot(robot?.name ?? null)
  return (
    <ApiHostProvider
      hostname={robot.ip ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellUSBRequestor : undefined}
      token={token}
    >
      {children}
    </ApiHostProvider>
  )
}
