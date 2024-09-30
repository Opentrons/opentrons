import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Navigate } from 'react-router-dom'

import {
  Banner,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SIZE_6,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { useSelector } from 'react-redux'

import {
  CONNECTABLE,
  UNREACHABLE,
  REACHABLE,
  OPENTRONS_USB,
} from '/app/redux/discovery'
import { appShellRequestor } from '/app/redux/shell/remote'
import { getRobotUpdateSession } from '/app/redux/robot-update'
import { getDevtoolsEnabled } from '/app/redux/config'
import { useRobot } from '/app/redux-resources/robots'
import { Line } from '/app/atoms/structure'
import { NavTab } from '/app/molecules/NavTab'
import { RobotSettingsCalibration } from '/app/organisms/Desktop/RobotSettingsCalibration'
import { RobotSettingsAdvanced } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsAdvanced'
import { RobotSettingsNetworking } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsNetworking'
import { RobotSettingsFeatureFlags } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsFeatureFlags'
import { ReachableBanner } from '/app/organisms/Desktop/Devices/ReachableBanner'

import type { DesktopRouteParams, RobotSettingsTab } from '/app/App/types'

export function RobotSettings(): JSX.Element | null {
  const { t } = useTranslation('device_settings')
  const { robotName, robotSettingsTab } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const robot = useRobot(robotName)
  const isCalibrationDisabled = robot?.status !== CONNECTABLE
  const isNetworkingDisabled = robot?.status === UNREACHABLE
  const [showRobotBusyBanner, setShowRobotBusyBanner] = useState<boolean>(false)
  const robotUpdateSession = useSelector(getRobotUpdateSession)

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
    robotUpdateSession == null
  ) {
    return <Navigate to={`/devices/${robotName}`} />
  }
  const cannotViewCalibration =
    robotSettingsTab === 'calibration' && isCalibrationDisabled
  const cannotViewFeatureFlags =
    robotSettingsTab === 'feature-flags' && !devToolsOn
  if (cannotViewCalibration || cannotViewFeatureFlags) {
    return <Navigate to={`/devices/${robotName}/robot-settings/networking`} />
  }

  const robotSettingsContent = robotSettingsContentByTab[robotSettingsTab] ?? (
    // default to the calibration tab if no tab or nonexistent tab is passed as a param
    <Navigate to={`/devices/${robotName}/robot-settings/calibration`} />
  )

  return (
    <Box minWidth={SIZE_6} height="max-content" padding={SPACING.spacing16}>
      <Flex
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius8}
        flexDirection={DIRECTION_COLUMN}
        marginBottom={SPACING.spacing16}
        minHeight="calc(100vh - 3.5rem)"
        width="100%"
      >
        <Box paddingX={SPACING.spacing16}>
          <Box
            color={COLORS.black90}
            css={TYPOGRAPHY.h1Default}
            padding={`${SPACING.spacing24} 0`}
          >
            {t('robot_settings')}
          </Box>
          {robot != null && (
            <Box marginBottom={SPACING.spacing16}>
              <ReachableBanner robot={robot} />
            </Box>
          )}
          {showRobotBusyBanner && (
            <Banner type="warning" marginBottom={SPACING.spacing16}>
              <LegacyStyledText as="p">
                {t('some_robot_controls_are_not_available')}
              </LegacyStyledText>
            </Banner>
          )}
          <Flex gridGap={SPACING.spacing16}>
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
        <Box padding={`${SPACING.spacing24} ${SPACING.spacing16}`}>
          <ApiHostProvider
            hostname={robot?.ip ?? null}
            port={robot?.port ?? null}
            requestor={
              robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined
            }
          >
            {robotSettingsContent}
          </ApiHostProvider>
        </Box>
      </Flex>
    </Box>
  )
}
