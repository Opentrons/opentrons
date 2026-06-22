import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Navigate, useParams } from 'react-router-dom'

import { Banner, LegacyStyledText, SPACING } from '@opentrons/components'
import {
  ApiHostProvider,
  useAccessControlEnabledQuery,
} from '@opentrons/react-api-client'

import { RoundTab } from '/app/molecules/RoundTab'
import { ReachableBanner } from '/app/organisms/Desktop/Devices/ReachableBanner'
import { RobotSettingsAdvanced } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsAdvanced'
import { RobotSettingsCamera } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera'
import { RobotSettingsComplianceReady } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsComplianceReady'
import { RobotSettingsFeatureFlags } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsFeatureFlags'
import { RobotSettingsNetworking } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsNetworking'
import { RobotCertRotator } from '/app/organisms/Desktop/RobotCertImport/RobotCertRotator'
import { RobotSettingsCalibration } from '/app/organisms/Desktop/RobotSettingsCalibration'
import { useIsRobotBusy, useRobot } from '/app/redux-resources/robots'
import { getDevtoolsEnabled } from '/app/redux/config'
import {
  CONNECTABLE,
  OPENTRONS_USB,
  REACHABLE,
  UNREACHABLE,
} from '/app/redux/discovery'
import { useAccessTokenForRobot } from '/app/redux/robot-auth'
import { getRobotUpdateSession } from '/app/redux/robot-update'
import { appShellUSBRequestor } from '/app/redux/shell/remote'

import styles from './robotsettings.module.css'

import type { DesktopRouteParams, RobotSettingsTab } from '/app/App/types'
import type { DiscoveredRobot } from '/app/redux/discovery/types'

export function RobotSettings(): JSX.Element {
  const { robotName } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const robot = useRobot(robotName)
  const token = useAccessTokenForRobot(robotName)

  return (
    <ApiHostProvider
      hostname={robot?.ip ?? null}
      port={robot?.port ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellUSBRequestor : undefined}
      token={token}
    >
      <RobotCertRotator>
        <RobotSettingsComponent robot={robot} />
      </RobotCertRotator>
    </ApiHostProvider>
  )
}

export function RobotSettingsComponent({
  robot,
}: {
  robot: DiscoveredRobot | null
}): JSX.Element | null {
  const { t } = useTranslation('device_settings')
  const { robotName, robotSettingsTab } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const isCalibrationDisabled = robot?.status !== CONNECTABLE
  const isNetworkingDisabled = robot?.status === UNREACHABLE
  const [showRobotBusyBanner, setShowRobotBusyBanner] = useState<boolean>(false)
  const robotUpdateSession = useSelector(getRobotUpdateSession)
  const isRobotBusy = useIsRobotBusy({ poll: true })

  if (isRobotBusy && !showRobotBusyBanner) {
    setShowRobotBusyBanner(true)
  } else if (!isRobotBusy && showRobotBusyBanner) {
    setShowRobotBusyBanner(false)
  }

  const robotSettingsContentByTab: {
    [K in RobotSettingsTab]: JSX.Element
  } = {
    calibration: (
      <RobotSettingsCalibration
        robotName={robotName}
        isRobotBusy={isRobotBusy}
      />
    ),
    networking: (
      <RobotSettingsNetworking
        robotName={robotName}
        isRobotBusy={isRobotBusy}
      />
    ),
    camera: (
      <RobotSettingsCamera robotName={robotName} isRobotBusy={isRobotBusy} />
    ),
    advanced: (
      <RobotSettingsAdvanced robotName={robotName} isRobotBusy={isRobotBusy} />
    ),
    'compliance-ready': <RobotSettingsComplianceReady robotName={robotName} />,
    'feature-flags': <RobotSettingsFeatureFlags robotName={robotName} />,
  }

  const devToolsOn = useSelector(getDevtoolsEnabled)
  const accessControlEnabledQuery = useAccessControlEnabledQuery()
  const isAcmDevice =
    accessControlEnabledQuery.data?.data.accessControlEnabled ?? false
  const showComplianceReadyTab = isAcmDevice

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
  const cannotViewComplianceReady =
    robotSettingsTab === 'compliance-ready' && !showComplianceReadyTab
  if (
    cannotViewCalibration ||
    cannotViewFeatureFlags ||
    cannotViewComplianceReady
  ) {
    return <Navigate to={`/devices/${robotName}/robot-settings/networking`} />
  }

  const robotSettingsContent = robotSettingsContentByTab[robotSettingsTab] ?? (
    // default to the calibration tab if no tab or nonexistent tab is passed as a param
    <Navigate to={`/devices/${robotName}/robot-settings/calibration`} />
  )
  const isComplianceReadyTab = robotSettingsTab === 'compliance-ready'

  return (
    <>
      <div className={styles.header_section}>
        <div className={styles.header_content}>
          {t('robot_settings')}
          {robot != null && (
            <div className={styles.reachable_banner_wrapper}>
              <ReachableBanner robot={robot} />
            </div>
          )}
          {showRobotBusyBanner && (
            <Banner type="warning" marginBottom={SPACING.spacing8}>
              <LegacyStyledText forwardedAs="p">
                {t('some_robot_controls_are_not_available')}
              </LegacyStyledText>
            </Banner>
          )}
        </div>
      </div>
      <div className={styles.tabs_section}>
        <div className={styles.tabs_row}>
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
          {showComplianceReadyTab ? (
            <RoundTab
              to={`/devices/${robotName}/robot-settings/compliance-ready`}
              tabName={t('compliance_ready')}
              disabled={false}
            />
          ) : null}
          {devToolsOn ? (
            <RoundTab
              to={`/devices/${robotName}/robot-settings/feature-flags`}
              tabName={t('feature_flags')}
              disabled={false}
            />
          ) : null}
        </div>
      </div>
      <div className={styles.content_section}>
        {isComplianceReadyTab ? (
          <div className={styles.content_bottom_spacing}>
            {robotSettingsContent}
          </div>
        ) : (
          <div className={styles.tab_content_card}>{robotSettingsContent}</div>
        )}
      </div>
    </>
  )
}
