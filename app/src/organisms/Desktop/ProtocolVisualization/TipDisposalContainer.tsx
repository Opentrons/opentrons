import { useTranslation } from 'react-i18next'

import { COLORS, RobotInfoLabel, StyledText, Tag } from '@opentrons/components'

import styles from './tipdisposalcontainer.module.css'

export function TipDisposalContainer(): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tag text={t('tip_disposal')} type="default" shrinkToContent />
        <RobotInfoLabel deckLabel={t('trash_bin')} />
      </div>
      <div className={styles.main_content}>
        <div className={styles.text_container}>
          <StyledText desktopStyle="captionSemiBold" color={COLORS.grey60}>
            {t('tips_in_trash')}
          </StyledText>
          <StyledText desktopStyle="captionSemiBold">
            {t('remaining_tips', { remaining: 10 })}
          </StyledText>
        </div>
        <div className={styles.text_container}>
          <StyledText desktopStyle="captionSemiBold" color={COLORS.grey60}>
            {t('lids_in_trash')}
          </StyledText>
          <StyledText desktopStyle="captionSemiBold">{'lids num'}</StyledText>
        </div>
      </div>
    </div>
  )
}
