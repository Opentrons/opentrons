import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import { useCameraAnalytics } from '/app/redux-resources/analytics/'

import styles from './setupcamera.module.css'

import type { RobotType } from '@opentrons/shared-data'
import type { UseCameraUsageSettingsResult } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useCameraUsageSettings'

export interface SetupCameraProps {
  settings: UseCameraUsageSettingsResult
  robotType: RobotType
  runId: string
}

export function SetupRunCameraUsage({
  settings,
  robotType,
  runId,
}: SetupCameraProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const baseParams = {
    source: 'protocolRunRecord' as const,
    robotType: robotType,
    runId: runId,
  }
  const { reportCameraEnablementSettings } = useCameraAnalytics(baseParams)
  reportCameraEnablementSettings({
    ...baseParams,
    cameraEnabled: settings.isCameraEnabled,
    liveFeedEnabled: settings.isLiveVideoEnabled,
    recoveryCaptureEnabled: settings.isRecoveryCaptureEnabled,
  })
  return (
    <div className={styles.usage_settings_container}>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('usage_settings')}
      </StyledText>
      <div className={styles.usage_settings_card_container}>
        <SettingCard
          title={t('live_video')}
          subtext={t('view_realtime_video')}
          toggleLabelText={t('live_video')}
          enabled={settings.isLiveVideoEnabled}
          onToggle={settings.toggleLiveVideoEnabled}
        />
        <SettingCard
          title={t('error_recovery')}
          subtext={t('automatically_capture_image')}
          toggleLabelText={t('error_recovery')}
          enabled={settings.isRecoveryCaptureEnabled}
          onToggle={settings.toggleRecoveryCaptureEnabled}
        />
      </div>
    </div>
  )
}

interface SettingCardProps {
  title: string
  subtext: string
  toggleLabelText: string
  enabled: boolean
  onToggle: () => void
}

function SettingCard({
  title,
  subtext,
  toggleLabelText,
  onToggle,
  enabled,
}: SettingCardProps): JSX.Element {
  return (
    <div className={styles.camera_setting_container}>
      <div className={styles.camera_setting_text_container}>
        <StyledText desktopStyle="bodyDefaultSemiBold">{title}</StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">{subtext}</StyledText>
      </div>
      <div className={styles.setting_toggle_container}>
        <ToggleButton
          label={toggleLabelText}
          toggledOn={enabled}
          onClick={onToggle}
        />
      </div>
    </div>
  )
}
