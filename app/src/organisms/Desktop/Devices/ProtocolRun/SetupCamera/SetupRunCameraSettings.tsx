import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import { useCameraAnalytics } from '/app/redux-resources/analytics/'

import styles from './setupcamera.module.css'

import type { RobotType } from '@opentrons/shared-data'

export interface SetupCameraProps {
  robotType: RobotType
  runId: string
  cameraEnabled: boolean
  liveStreamEnabled: boolean
  recoveryEnabled: boolean
  cameraConfirmed: boolean
  toggleRecoveryEnabled: () => void
  toggleLiveStreamEnabled: () => void
}

export function SetupRunCameraUsage({
  robotType,
  runId,
  cameraEnabled,
  liveStreamEnabled,
  recoveryEnabled,
  cameraConfirmed,
  toggleRecoveryEnabled,
  toggleLiveStreamEnabled,
}: SetupCameraProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const baseParams = {
    source: 'runRecord' as const,
    robotType,
    runId,
  }

  const { reportCameraEnablementSettings } = useCameraAnalytics(baseParams)

  const handleToggleLiveStream = (): void => {
    toggleLiveStreamEnabled()
    reportCameraEnablementSettings({
      ...baseParams,
      cameraEnabled,
      liveFeedEnabled: !liveStreamEnabled,
      recoveryCaptureEnabled: recoveryEnabled,
    })
  }

  const handleToggleRecovery = (): void => {
    toggleRecoveryEnabled()
    reportCameraEnablementSettings({
      ...baseParams,
      cameraEnabled,
      liveFeedEnabled: liveStreamEnabled,
      recoveryCaptureEnabled: !recoveryEnabled,
    })
  }

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
          enabled={liveStreamEnabled}
          onToggle={handleToggleLiveStream}
          isToggleDisabled={cameraConfirmed}
        />
        <SettingCard
          title={t('error_recovery')}
          subtext={t('automatically_capture_image')}
          toggleLabelText={t('error_recovery')}
          enabled={recoveryEnabled}
          onToggle={handleToggleRecovery}
          isToggleDisabled={cameraConfirmed}
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
  isToggleDisabled: boolean
  onToggle: () => void
}

function SettingCard({
  title,
  subtext,
  toggleLabelText,
  isToggleDisabled,
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
          disabled={isToggleDisabled}
        />
      </div>
    </div>
  )
}
