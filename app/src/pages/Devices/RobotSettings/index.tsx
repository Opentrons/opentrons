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

import {
  CONNECTABLE,
  UNREACHABLE,
  REACHABLE,
  OPENTRONS_USB,
} from '../../../redux/discovery'
import { appShellRequestor } from '../../../redux/shell/remote'
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
import { RobotSettingsPrivacy } from '../../../organisms/Devices/RobotSettings/RobotSettingsPrivacy'
import { ReachableBanner } from '../../../organisms/Devices/ReachableBanner'

import type { DesktopRouteParams, RobotSettingsTab } from '../../../App/types'

export function RobotSettings(): JSX.Element | null {
  const { t } = useTranslation('device_settings')
  const { robotName, robotSettingsTab } = useParams<DesktopRouteParams>()
  const robot = useRobot(robotName)
  const isCalibrationDisabled = robot?.status !== CONNECTABLE
  const isPrivacyDisabled = robot?.status === UNREACHABLE
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
    privacy: <RobotSettingsPrivacy robotName={robotName} />,
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
  const cannotViewPrivacy = robotSettingsTab === 'privacy' && isPrivacyDisabled
  if (cannotViewCalibration || cannotViewFeatureFlags || cannotViewPrivacy) {
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
      padding={SPACING.spacing16}
    >
      <Flex
        backgroundColor={COLORS.white}
        border={BORDERS.lineBorder}
        borderRadius={BORDERS.radiusSoftCorners}
        flexDirection={DIRECTION_COLUMN}
        marginBottom={SPACING.spacing16}
        minHeight="calc(100vh - 3.5rem)"
        width="100%"
      >
        <Box paddingX={SPACING.spacing16}>
          <Box
            color={COLORS.black}
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
              <StyledText as="p">
                {t('some_robot_controls_are_not_available')}
              </StyledText>
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
              to={`/devices/${robotName}/robot-settings/privacy`}
              tabName={t('privacy')}
              disabled={isPrivacyDisabled}
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
