import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { COLORS, RobotInfoLabel, StyledText, Tag } from '@opentrons/components'

import { stepDetailViewerOpenAction } from '/app/redux/shell'

import styles from './tippickupcontainer.module.css'

interface TipPickupContainerProps {
  protocolKey: string // the interface  will be updated soon
}

export function TipPickupContainer({
  protocolKey,
}: TipPickupContainerProps): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation('protocol_visualization')
  return (
    <div
      className={styles.container}
      onClick={() => dispatch(stepDetailViewerOpenAction(protocolKey))}
    >
      <div className={styles.header}>
        <Tag text={t('tipPickup')} type="default" shrinkToContent />
        <RobotInfoLabel deckLabel="slot" />
      </div>
      <div className={styles.subheader}>
        <StyledText desktopStyle="captionSemiBold">
          {'tip rack name'}
        </StyledText>
      </div>
      <div className={styles.main_content}>{/* TODO: add main content */}</div>
      <div className={styles.footer}>
        <StyledText desktopStyle="captionSemiBold" color={COLORS.grey60}>
          {t('tips_remaining')}
        </StyledText>
        <StyledText desktopStyle="captionSemiBold">
          {t('remaining_tips', { remaining: 10 })}
        </StyledText>
      </div>
    </div>
  )
}
