import { useTranslation } from 'react-i18next'

import { COLORS, RobotInfoLabel, StyledText, Tag } from '@opentrons/components'

import styles from './tippickupcontainer.module.css'

export function TipPickupContainer(): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  return (
    <div className={styles.container}>
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
