import styles from './tipdisposalslot.module.css'

import type { ReactNode } from 'react'

export function TipDisposalSlot(): ReactNode {
  return (
    <div className={styles.container}>
      <div className={styles.main_content}>
        {/* <div className={styles.text_container}>
          <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
            {disposalType === 'trash'
              ? t('tips_in_trash')
              : t('tips_in_waste_chute')}
          </StyledText>
          <StyledText desktopStyle="captionRegular">
            {t('remaining_tips', { remaining: totalEmptyTips })}
          </StyledText>
        </div> */}
        {/* Note this is for phase-2
          <div className={styles.text_container}>
          <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
            {t('lids_in_trash')}
          </StyledText>
          <StyledText desktopStyle="captionRegular">{'lids num'}</StyledText>
        </div> */}
      </div>
    </div>
  )
}
