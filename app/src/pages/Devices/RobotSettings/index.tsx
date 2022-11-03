import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect, useParams } from 'react-router-dom'

import {
  Box,
  Flex,
  DIRECTION_COLUMN,
  OVERFLOW_SCROLL,
  SIZE_6,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { useSelector } from 'react-redux'

import { CONNECTABLE, UNREACHABLE, REACHABLE } from '../../../redux/discovery'
import { getBuildrootSession } from '../../../redux/buildroot'
import { getDevtoolsEnabled } from '../../../redux/config'
import { StyledText } from '../../../atoms/text'
import { Banner } from '../../../atoms/Banner'
import { useRobot } from '../../../organisms/Devices/hooks'
import { Line } from '../../../atoms/structure'
import { NavTab } from '../../../molecules/NavTab'
import { RobotSettingsCalibration } from '../../../organisms/RobotSettingsCalibration'
import { RobotSettingsAdvanced } from '../../../organisms/Devices/RobotSettings/RobotSettingsAdvanced'
import { RobotSettingsNetworking } from '../../../organisms/Devices/RobotSettings/RobotSettingsNetworking'
import { RobotSettingsFeatureFlags } from '../../../organisms/Devices/RobotSettings/RobotSettingsFeatureFlags'
import { ReachableBanner } from '../../../organisms/Devices/ReachableBanner'

import type { NavRouteParams, RobotSettingsTab } from '../../../App/types'

export function RobotSettings(): JSX.Element | null {
  const { t } = useTranslation('device_settings')
  const { robotName, robotSettingsTab } = useParams<NavRouteParams>()
  const robot = useRobot(robotName)
  const isCalibrationDisabled = robot?.status !== CONNECTABLE
  const isNetworkingDisabled = robot?.status === UNREACHABLE
  const [showRobotBusyBanner, setShowRobotBusyBanner] = React.useState<boolean>(
    false
  )
  const buildrootUpdateSession = useSelector(getBuildrootSession)

  const updateRobotStatus = (isRobotBusy: boolean): void => {
    if (isRobotBusy) setShowRobotBusyBanner(true)
  }

  const robotSettingsContentByTab: {
    [K in RobotSettingsTab]: JSX.Element
  } = {
    calibration: (
      <RobotSettingsCalibration
        robotName={robotName}
        updateRobotStatus={updateRobotStatus}
      />
    ),
    networking: (
      <RobotSettingsNetworking
        robotName={robotName}
        updateRobotStatus={updateRobotStatus}
      />
    ),
    advanced: (
      <RobotSettingsAdvanced
        robotName={robotName}
        updateRobotStatus={updateRobotStatus}
      />
    ),
    'feature-flags': <RobotSettingsFeatureFlags robotName={robotName} />,
  }

  const devToolsOn = useSelector(getDevtoolsEnabled)

  if (
    (robot == null ||
      robot?.status === UNREACHABLE ||
      (robot?.status === REACHABLE && robot?.serverHealthStatus !== 'ok')) &&
    buildrootUpdateSession == null
  ) {
    return <Redirect to={`/devices/${robotName}`} />
  }
  const cannotViewCalibration =
    robotSettingsTab === 'calibration' && isCalibrationDisabled
  const cannotViewFeatureFlags =
    robotSettingsTab === 'feature-flags' && !devToolsOn
  if (cannotViewCalibration || cannotViewFeatureFlags) {
    return <Redirect to={`/devices/${robotName}/robot-settings/networking`} />
  }

  const robotSettingsContent = robotSettingsContentByTab[robotSettingsTab] ?? (
    // default to the calibration tab if no tab or nonexistent tab is passed as a param
    <Redirect to={`/devices/${robotName}/robot-settings/calibration`} />
  )

  return (
    <Box
      minWidth={SIZE_6}
      height="100%"
      overflow={OVERFLOW_SCROLL}
      padding={SPACING.spacing4}
    >
      <Flex
        backgroundColor={COLORS.white}
        border={BORDERS.lineBorder}
        borderRadius={BORDERS.radiusSoftCorners}
        flexDirection={DIRECTION_COLUMN}
        marginBottom={SPACING.spacing4}
        width="100%"
      >
        <Box padding={`0 ${SPACING.spacing4}`}>
          <Box
            color={COLORS.black}
            css={TYPOGRAPHY.h1Default}
            padding={`${SPACING.spacing5} 0`}
          >
            {t('robot_settings')}
          </Box>
          {robot != null && (
            <Box marginBottom={SPACING.spacing4}>
              <ReachableBanner robot={robot} />
            </Box>
          )}
          {showRobotBusyBanner && (
            <Banner type="warning" marginBottom={SPACING.spacing4}>
              <StyledText as="p">
                {t('some_robot_controls_are_not_available')}
              </StyledText>
            </Banner>
          )}
          <Flex gridGap={SPACING.spacing4}>
            <NavTab
              to={`/devices/${robotName}/robot-settings/calibration`}
              tabName={t('calibration')}
              disabled={isCalibrationDisabled}
            />
            <NavTab
              to={`/devices/${robotName}/robot-settings/networking`}
              tabName={t('networking')}
              disabled={isNetworkingDisabled}
            />
            <NavTab
              to={`/devices/${robotName}/robot-settings/advanced`}
              tabName={t('advanced')}
            />
            {devToolsOn ? (
              <NavTab
                to={`/devices/${robotName}/robot-settings/feature-flags`}
                tabName={t('feature_flags')}
              />
            ) : null}
          </Flex>
        </Box>
        <Line />
        <Box padding={`${SPACING.spacing5} ${SPACING.spacing4}`}>
          <ApiHostProvider
            hostname={robot?.ip ?? null}
            port={robot?.port ?? null}
          >
            {robotSettingsContent}
          </ApiHostProvider>
        </Box>
      </Flex>
    </Box>
  )
}
