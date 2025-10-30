import { useTranslation } from 'react-i18next'

import { Chip, SPACING } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { ODDBackButton } from '/app/molecules/ODDBackButton'
import { CameraSettings } from '/app/organisms/ODD/CameraSettings'

import styles from './setupcamera.module.css'

import type { Dispatch, SetStateAction } from 'react'
import type { SetupScreens } from '/app/organisms/ODD/ProtocolSetup'
import type { RobotStorageInfo } from '/app/resources/health/useIsImageStorageLow'

export interface ProtocolSetupCameraProps {
  storageInfo: RobotStorageInfo
  confirmCameraPreferences: () => void
  isConfirmed: boolean
  setSetupScreen: Dispatch<SetStateAction<SetupScreens>>
}

export function ProtocolSetupCamera(
  props: ProtocolSetupCameraProps
): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  return (
    <CameraSettings
      headerElement={<SetupCameraHeader {...props} />}
      sectionHeadingText={t('review_camera_preferences')}
      storageInfo={props.storageInfo}
    />
  )
}

function SetupCameraHeader({
  setSetupScreen,
  confirmCameraPreferences,
  isConfirmed,
}: ProtocolSetupCameraProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  return (
    <div className={styles.header_container}>
      <ODDBackButton
        label={t('camera')}
        onClick={() => {
          setSetupScreen('prepare to run')
        }}
      />
      {isConfirmed ? (
        <Chip
          background
          iconName="ot-check"
          // TODO(jh, 10-01-25): Handle `disabled` success chip!
          text={t('enabled')}
          type="success"
        />
      ) : (
        <SmallButton
          buttonText={t('confirm_preferences')}
          onClick={confirmCameraPreferences}
          buttonCategory="rounded"
          padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
        />
      )}
    </div>
  )
}
