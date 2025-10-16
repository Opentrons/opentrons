import { useTranslation } from 'react-i18next'

import { RobotInfoLabel, StyledText, Tag } from '@opentrons/components'

import styles from './destinationlabwarecontainer.module.css'

interface DestinationLabwareContainerProps {
  protocolKey: string // the interface will be updated soon
  slotId: string | null
}
export function DestinationLabwareContainer({
  protocolKey,
  slotId,
}: DestinationLabwareContainerProps): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tag text={t('destination_labware')} type="default" shrinkToContent />
        <RobotInfoLabel deckLabel={slotId ?? ''} />
        {/* todo need to support module icons */}
      </div>
      <div className={styles.subheader}>
        <StyledText desktopStyle="captionSemiBold">
          {'destination labware name'}
        </StyledText>
      </div>
      <div className={styles.subheader}>
        <Tag
          text={t('quantity', { quantity: 10 })}
          type="default"
          shrinkToContent
        />
      </div>
      <div className={styles.main_content}></div>
    </div>
  )
}
