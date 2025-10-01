import { useTranslation } from 'react-i18next'

import { ListButton, StyledText } from '@opentrons/components'

import styles from './preferences.module.css'

// eslint-disable-next-line opentrons/no-imports-across-applications -- For active dev only
import type { UseStubCameraUsageSettingsResult } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useStubCameraUsageSettings'

export interface CameraEnableSettingProps {
  isCameraEnabled: UseStubCameraUsageSettingsResult['isCameraEnabled']
  toggleCameraEnabled: UseStubCameraUsageSettingsResult['toggleCameraEnabled']
}

export function CameraEnableSetting({
  isCameraEnabled,
  toggleCameraEnabled,
}: CameraEnableSettingProps): JSX.Element {
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
