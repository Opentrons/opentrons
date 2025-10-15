import { useTranslation } from 'react-i18next'

import { RobotInfoLabel, StyledText, Tag } from '@opentrons/components'

import styles from './sourcelabwarecontainer.module.css'

export function SourceLabwareContainer(): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tag text={t('source_labware')} type="default" shrinkToContent />
        <RobotInfoLabel deckLabel="slot" />
      </div>
      <div className={styles.subheader}>
        <StyledText desktopStyle="captionSemiBold">
          {'source labware name'}
        </StyledText>
      </div>
      <div className={styles.main_content}></div>
    </div>
  )
}
