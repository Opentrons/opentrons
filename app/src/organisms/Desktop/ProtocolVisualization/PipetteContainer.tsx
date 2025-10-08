import { useTranslation } from 'react-i18next'

import { RobotInfoLabel, StyledText, Tag } from '@opentrons/components'

import styles from './pipettecontainer.module.css'

// Note these props might be changed
interface PipetteContainerProps {
  mount: string
  pipetteName: string
  // onClick: () => void
}

export function PipetteContainer({
  mount,
  pipetteName,
}: PipetteContainerProps): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  // ToDo (kk:2025/10/06) make the following clickable
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tag text={t('pipette')} type="default" />
        <RobotInfoLabel deckLabel={mount} />
      </div>
      <div className={styles.body}>
        <StyledText>{pipetteName}</StyledText>
      </div>
    </div>
  )
}
