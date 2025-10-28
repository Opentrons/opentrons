import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { CameraCard } from './CameraCard'
import styles from './inputdevices.module.css'

export interface PeripheralsProps {
  isFlex: boolean
  robotName: string
}

export function Peripherals({
  isFlex,
  robotName,
}: PeripheralsProps): JSX.Element {
  const { t } = useTranslation('device_details')

  return (
    <div className={styles.container}>
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('peripherals')}
      </StyledText>
      <CameraCard isFlex={isFlex} robotName={robotName} />
    </div>
  )
}
