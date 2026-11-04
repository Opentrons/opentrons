import { useTranslation } from 'react-i18next'

import { ListButton, StyledText } from '@opentrons/components'

import styles from './preferences.module.css'

import type { ReactNode } from 'react'
import type { UseCameraUsageSettingsResult } from '/app/local-resources/images/hooks/useCameraUsageSettings'

export interface CameraEnableSettingProps {
  isCameraEnabled: UseCameraUsageSettingsResult['isCameraEnabled']
  toggleCameraEnabled: UseCameraUsageSettingsResult['toggleCameraEnabled']
}

export function CameraEnableSetting({
  isCameraEnabled,
  toggleCameraEnabled,
}: CameraEnableSettingProps): ReactNode {
  const { t } = useTranslation('device_settings')

  return (
    <ListButton
      type="noActive"
      className={styles.setting_card}
      onClick={toggleCameraEnabled}
    >
      <StyledText oddStyle="level4HeaderSemiBold">{t('camera')}</StyledText>
      <div className={styles.setting_card_text_container}>
        <StyledText
          oddStyle="level4HeaderRegular"
          className={
            isCameraEnabled
              ? styles.setting_card_text_enabled
              : styles.setting_card_text_disabled
          }
        >
          {isCameraEnabled ? t('enabled') : t('disabled')}
        </StyledText>
      </div>
    </ListButton>
  )
}
