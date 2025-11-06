import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Navigate, useParams } from 'react-router-dom'

import {
  Banner,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_AROUND,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { RoundTab } from '/app/molecules/RoundTab'
import { ReachableBanner } from '/app/organisms/Desktop/Devices/ReachableBanner'
import { RobotSettingsAdvanced } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsAdvanced'
import { RobotSettingsCamera } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera'
import { RobotSettingsFeatureFlags } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsFeatureFlags'
import { RobotSettingsNetworking } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsNetworking'
import { RobotSettingsCalibration } from '/app/organisms/Desktop/RobotSettingsCalibration'
import { useRobot, useRobotType } from '/app/redux-resources/robots'
import { getDevtoolsEnabled } from '/app/redux/config'
import {
  CONNECTABLE,
  OPENTRONS_USB,
  REACHABLE,
  UNREACHABLE,
} from '/app/redux/discovery'
import { getRobotUpdateSession } from '/app/redux/robot-update'
import { appShellRequestor } from '/app/redux/shell/remote'
import { useCurrentRunId } from '/app/resources/runs'

import type { DesktopRouteParams, RobotSettingsTab } from '/app/App/types'

export function RobotSettings(): JSX.Element | null {
  const { t } = useTranslation('device_settings')
  const { robotName, robotSettingsTab } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const robot = useRobot(robotName)
  const robotType = useRobotType(robotName)
  const isCalibrationDisabled = robot?.status !== CONNECTABLE
  const isNetworkingDisabled = robot?.status === UNREACHABLE
  const [showRobotBusyBanner, setShowRobotBusyBanner] = useState<boolean>(false)
  const robotUpdateSession = useSelector(getRobotUpdateSession)
  const doesRunExist = useCurrentRunId() != null

  if (!showRobotBusyBanner && doesRunExist) {
    setShowRobotBusyBanner(true)
  }

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
    camera: <RobotSettingsCamera robotType={robotType} />,
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
    <>
      <Box paddingX={SPACING.spacing16} paddingY={SPACING.spacing16}>
        <Flex
          color={COLORS.black90}
          flexDirection={DIRECTION_COLUMN}
          css={TYPOGRAPHY.h1Default}
          gridGap={SPACING.spacing4}
        >
          {t('robot_settings')}
          {robot != null && (
            <Box marginBottom={SPACING.spacing16}>
              <ReachableBanner robot={robot} />
            </Box>
          )}
          {showRobotBusyBanner && (
            <Banner type="warning" marginBottom={SPACING.spacing8}>
              <LegacyStyledText as="p">
                {t('some_robot_controls_are_not_available')}
              </LegacyStyledText>
            </Banner>
          )}
        </Flex>
      </Box>
      <Box paddingX={SPACING.spacing16}>
        <Flex gridGap={SPACING.spacing4}>
          <RoundTab
            to={`/devices/${robotName}/robot-settings/calibration`}
            tabName={t('calibration')}
            disabled={isCalibrationDisabled}
          />
          <RoundTab
            to={`/devices/${robotName}/robot-settings/networking`}
            tabName={t('networking')}
            disabled={isNetworkingDisabled}
          />
          <RoundTab
            to={`/devices/${robotName}/robot-settings/camera`}
            tabName={t('camera')}
            disabled={false}
          />
          <RoundTab
            to={`/devices/${robotName}/robot-settings/advanced`}
            tabName={t('advanced')}
            disabled={false}
          />
          {devToolsOn ? (
            <RoundTab
              to={`/devices/${robotName}/robot-settings/feature-flags`}
              tabName={t('feature_flags')}
              disabled={false}
            />
          ) : null}
        </Flex>
      </Box>
      <Box padding={`${SPACING.spacing24} ${SPACING.spacing16}`}>
        <ApiHostProvider
          hostname={robot?.ip ?? null}
          port={robot?.port ?? null}
          requestor={
            robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined
          }
        >
          <Flex
            width="100%"
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_SPACE_AROUND}
            backgroundColor={COLORS.white}
            borderRadius={BORDERS.borderRadius8}
            marginBottom={SPACING.spacing16}
            paddingX={SPACING.spacing16}
            paddingY={SPACING.spacing16}
          >
            {robotSettingsContent}
          </Flex>
        </ApiHostProvider>
      </Box>
    </>
  )
}
