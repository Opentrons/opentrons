import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { ToggleButton } from '/app/atoms/buttons'
import { useRobotType } from '/app/redux-resources/robots'

import styles from './setupcamera.module.css'

import type { ReactNode } from 'react'

export interface SetupCameraProps {
  robotName: string
  liveStreamEnabled: boolean
  recoveryEnabled: boolean
  cameraConfirmed: boolean
  toggleRecoveryEnabled: () => void
  toggleLiveStreamEnabled: () => void
}

export function SetupRunCameraUsage({
  robotName,
  liveStreamEnabled,
  recoveryEnabled,
  cameraConfirmed,
  toggleRecoveryEnabled,
  toggleLiveStreamEnabled,
}: SetupCameraProps): ReactNode {
  const { t } = useTranslation('device_settings')
  const robotType = useRobotType(robotName)

  return (
    <div className={styles.usage_settings_container}>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('usage_settings')}
      </StyledText>
      <div className={styles.usage_settings_card_container}>
        {robotType !== OT2_ROBOT_TYPE && (
          <SettingCard
            title={t('live_video')}
            subtext={t('view_realtime_video')}
            toggleLabelText={t('live_video')}
            enabled={liveStreamEnabled}
            onToggle={toggleLiveStreamEnabled}
            isToggleDisabled={cameraConfirmed}
          />
        )}
        <SettingCard
          title={t('error_recovery_lc')}
          subtext={t('automatically_capture_image')}
          toggleLabelText={t('error_recovery')}
          enabled={recoveryEnabled}
          onToggle={toggleRecoveryEnabled}
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
}: SettingCardProps): ReactNode {
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
