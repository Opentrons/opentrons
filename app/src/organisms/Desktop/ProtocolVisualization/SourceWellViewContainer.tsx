import { useTranslation } from 'react-i18next'

import { RobotInfoLabel, Tag } from '@opentrons/components'

import styles from './sourcewellviewcontainer.module.css'

interface SourceWellViewContainerProps {
  protocolKey: string // the interface will be updated soon
}
export function SourceWellViewContainer({
  protocolKey,
}: SourceWellViewContainerProps): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tag text={t('source_well_view')} type="default" shrinkToContent />
        <RobotInfoLabel deckLabel={t('well_name', { wellName: 'A1' })} />
      </div>
      <div className={styles.main_content}></div>
    </div>
  )
}
