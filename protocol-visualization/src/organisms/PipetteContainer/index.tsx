import { useTranslation } from 'react-i18next'

import { Chip, RobotInfoLabel, StyledText, Tag } from '@opentrons/components'
import { getPipetteNameSpecs } from '@opentrons/shared-data'

import styles from './pipettecontainer.module.css'

import type { ReactNode } from 'react'
import type { PipetteName } from '@opentrons/shared-data'

interface PipetteContainerProps {
  mount: string
  pipetteName: PipetteName
  selected: boolean
}

export function PipetteContainer({
  mount,
  pipetteName,
  selected,
}: PipetteContainerProps): ReactNode {
  const { t } = useTranslation('protocol_visualization')
  const pipetteDisplayName = getPipetteNameSpecs(pipetteName)?.displayName ?? ''

  return (
    <div className={styles.container_wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Tag text={t('pipette')} type="default" shrinkToContent />
          <RobotInfoLabel deckLabel={t(mount)} />
        </div>
        <div className={styles.main_content}>
          <StyledText desktopStyle="captionRegular">
            {pipetteDisplayName}
          </StyledText>
          {selected ? (
            <Chip
              text={t('active')}
              type="success"
              iconName="circle"
              chipSize="small"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
