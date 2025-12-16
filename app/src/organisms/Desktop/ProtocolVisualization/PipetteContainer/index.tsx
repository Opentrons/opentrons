import { useTranslation } from 'react-i18next'

import { Chip, RobotInfoLabel, StyledText, Tag } from '@opentrons/components'

import { usePipetteNameSpecs } from '/app/local-resources/instruments'

import styles from './pipettecontainer.module.css'

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
}: PipetteContainerProps): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  const pipetteDisplayName = usePipetteNameSpecs(pipetteName)?.displayName ?? ''

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tag text={t('pipette')} type="default" shrinkToContent />
        <RobotInfoLabel deckLabel={t(mount)} />
      </div>
      <div className={styles.main_content}>
        <StyledText desktopStyle="captionRegular">
          {pipetteDisplayName}
        </StyledText>
        {selected ? <Chip text={t('active')} type="success" /> : null}
      </div>
    </div>
  )
}
