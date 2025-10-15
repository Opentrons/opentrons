import { useTranslation } from 'react-i18next'

import { RobotInfoLabel, StyledText, Tag } from '@opentrons/components'

import { usePipetteNameSpecs } from '/app/local-resources/instruments'

import styles from './pipettecontainer.module.css'

import type { PipetteName } from '@opentrons/shared-data'

// Note these props might be changed
interface PipetteContainerProps {
  mount: string
  pipetteName: PipetteName
  // onClick: () => void
}

export function PipetteContainer({
  mount,
  pipetteName,
}: PipetteContainerProps): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  const pipetteDisplayName = usePipetteNameSpecs(pipetteName)?.displayName ?? ''

  // ToDo (kk:2025/10/06) make the following clickable
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tag text={t('pipette')} type="default" shrinkToContent />
        <RobotInfoLabel deckLabel={t(mount)} />
      </div>
      <div className={styles.main_content}>
        <StyledText>{pipetteDisplayName}</StyledText>
      </div>
    </div>
  )
}
