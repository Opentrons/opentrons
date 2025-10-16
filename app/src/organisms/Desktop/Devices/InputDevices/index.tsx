import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { CameraCard } from './CameraCard'
import styles from './inputdevices.module.css'

export interface InputDevicesProps {
  isFlex: boolean
  robotName: string
}

export function InputDevices({
  isFlex,
  robotName,
}: InputDevicesProps): JSX.Element {
  const { t } = useTranslation('device_details')

  return (
    <div className={styles.container}>
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('input_devices')}
      </StyledText>
      <CameraCard isFlex={isFlex} robotName={robotName} />
    </div>
  )
}
