import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { CameraCard } from './CameraCard'
import styles from './inputdevices.module.css'

import type { ReactNode } from 'react'
import type { CameraCardProps } from './CameraCard'

export type PeripheralsProps = CameraCardProps

export function Peripherals({
  isFlex,
  robotName,
  isRobotBusy,
}: PeripheralsProps): ReactNode {
  const { t } = useTranslation('device_details')

  return (
    <div className={styles.container}>
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('peripherals')}
      </StyledText>
      <div className={styles.card_column}>
        <CameraCard
          isFlex={isFlex}
          robotName={robotName}
          isRobotBusy={isRobotBusy}
        />
      </div>
    </div>
  )
}
